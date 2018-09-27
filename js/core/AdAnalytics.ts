import {Analytics} from './Analytics';
import { AdSample } from '../types/AdSample';
import { AnalyticsLicensingStatus } from '../enums/AnalyticsLicensingStatus';
import Utils from '../utils/Utils';
import { logger } from '../utils/Logger';
import { AdAnalyticsCallbacks } from '../types/AdAnalyticsCallbacks';
import { Adapter } from '../types/Adapter';
import { ViewportTracker } from '../utils/ViewportTracker';
import { AdBreakEvent, AdClickedEvent, AdEvent, AdQuartileEvent, AdLinearityChangedEvent, ErrorEvent, AdQuartile } from 'bitmovin-player';
import { AdAdapter } from '../types/AdAdapter';

declare var __VERSION__: any;

export class AdAnalytics implements AdAnalyticsCallbacks {
  static readonly MODULE_NAME = 'ads';

  private analytics: Analytics;
  private sample: AdSample = { 
    clicked: 0,
    closed: 0,
    completed: 0,
    midpoint: 0,
    quartile1: 0,
    quartile3: 0,
    skipped: 0,
    started: 0,
    timePlayed: 0
  };
  private container?: HTMLElement;
  private viewportTracker?: ViewportTracker;
  private adManifestLoadedEvents: (AdBreakEvent & {downloadTime?: number})[] = [];
  private adBreak?: any;
  private adModule?: string;
  private adStartupTimestamp?: number;
  private beginPlayingTimestamp?: number;
  private enterViewportTimestamp?: number;
  private isPlaying: boolean = false;
  private adapter?: AdAdapter;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
  }

  setAdModule(adModule: string) {
    this.adModule = this.sample.adModule = adModule;
  }

  setAdapter(adAdapter: AdAdapter) {
    this.adapter = adAdapter;

    if(this.viewportTracker) {
        this.viewportTracker.dispose();
    }
    this.container = this.adapter.getContainer();
    this.adModule = this.adapter ? this.adapter.getAdModule() : undefined;
    this.viewportTracker = new ViewportTracker(this.container, () => this.onIntersectionChanged(), 0.5);
  }

  onIntersectionChanged() {
    if(this.isContainerInViewport()) {
      this.enterViewportTimestamp = Utils.getCurrentTimestamp();
    }
    else {
      if(this.enterViewportTimestamp) {
        this.sample.timeInViewport = (this.sample.timeInViewport || 0) + Utils.getCurrentTimestamp() - this.enterViewportTimestamp;
      }
    }
  }

  isContainerInViewport(): boolean | undefined {
      return this.viewportTracker ? this.viewportTracker.isInViewport() : undefined;
  }

  onPlay(e) {
    console.log('onplay');
    this.startAd();
  }

  private updatePlayingTime() {
    if(this.beginPlayingTimestamp && this.isPlaying) {
      this.sample.timePlayed += Utils.getCurrentTimestamp() - this.beginPlayingTimestamp;
      if(this.isContainerInViewport() && this.enterViewportTimestamp) {
        this.sample.timeInViewport = (this.sample.timeInViewport || 0) + Utils.getCurrentTimestamp() - this.enterViewportTimestamp;
      }
    }
    console.log('updatePlayingTime');
    console.log('   timePlayed: ' + this.sample.timePlayed);
    console.log('   timeInViewport: ' + this.sample.timeInViewport);
  }

  onPause(e) {
    this.updatePlayingTime();
    this.isPlaying = false;
  }

  onAdManifestLoaded(event: AdBreakEvent) {
    this.adManifestLoadedEvents.push(event);
  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.setAdBreak(event.adBreak);
    this.adStartupTimestamp = Utils.getCurrentTimestamp();
    //for the first ad in this break, we set the manifest downloadtime
    const manifestLoadedEvent = this.adManifestLoadedEvents.find(e => e.adBreak === event.adBreak);
    this.sample.manifestDownloadTime = manifestLoadedEvent ? manifestLoadedEvent.downloadTime : undefined;
  }

  onAdBreakFinished(event: AdBreakEvent) {
    this.adManifestLoadedEvents.splice(this.adManifestLoadedEvents.findIndex(e => e.adBreak === event.adBreak), 1);
    this.setAdBreak(undefined);
  }

  private startAd() {
    this.beginPlayingTimestamp = Utils.getCurrentTimestamp();
    this.enterViewportTimestamp = Utils.getCurrentTimestamp();
    console.log('startAd');
    console.log('   beginPlayingTimestamp: ' + this.beginPlayingTimestamp);
    console.log('   enterViewportTimestamp: ' + this.enterViewportTimestamp);
    this.isPlaying = true;
  }

  onAdStarted(event: AdEvent) {
    this.sample.adStartupTime = this.adStartupTimestamp ? Utils.getCurrentTimestamp() - this.adStartupTimestamp : undefined;
    this.sample.started = 1;
    this.startAd();
  }

  onAdFinished(event: AdEvent) {
    this.sample.completed = 1;
    this.completeAd();
  }

  onAdSkipped(event: AdEvent) {
    this.sample.skipped = 1;
    this.sample.skipPosition = (<any>event).position;
    this.completeAd();
  }

  onAdError(event: ErrorEvent) {
    const { code, message } = event.data ? event.data : event;
    this.sample.errorCode = code;
    this.sample.errorMessage = message;
    this.completeAd();
  }

  private completeAd() {
    //reset startupTimestamp for the next ad, in case there are multiple ads in one ad break
    this.adStartupTimestamp = Utils.getCurrentTimestamp();
    this.updatePlayingTime();
    this.sendAnalyticsRequestAndClearValues();
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) { }

  onAdClicked(event: AdClickedEvent) {
    this.sample.clicked = 1;
    this.sample.clickPosition = (<any>event).position;
  }

  onAdQuartile(event: AdQuartileEvent) {
    if (event.quartile === AdQuartile.FIRST_QUARTILE) {
      this.sample.quartile1 = 1;
    } else if (event.quartile === AdQuartile.MIDPOINT) {
      this.sample.midpoint = 1;
    } else if (event.quartile === AdQuartile.THIRD_QUARTILE) {
      this.sample.quartile3 = 1
    }
  }

  onBeforeUnload() {
    console.log('onBeforeUnload');
  }

  sendAnalyticsRequestAndClearValues() {
    this.setAnalyticsSampleValues();
    this.sendAnalyticsRequest({...this.sample});
    this.clearValues();
  }

  setAdBreak(adBreak) {
    this.adBreak = adBreak;
    this.clearAdBreakValues();

    if(!adBreak) {
      return;
    }

    if (adBreak.position === 'pre' || adBreak.position === 'post') {
      this.sample.adPosition = adBreak.position;
    } else {
      this.sample.adPosition = 'mid';
      this.sample.adOffset = adBreak.position;
    }
    this.sample.adScheduleTime = adBreak.scheduleTime;
    this.sample.adReplaceContentDuration = adBreak.replaceContentDuration;
    this.sample.adPreloadOffset = adBreak.preloadOffset;
    this.sample.adSkipAfter = adBreak.skipAfter;
    this.sample.adTagType = adBreak.tag ? adBreak.tag.type : undefined;
    this.sample.adIsPersistent = adBreak.persistent;
    this.sample.adIdPlayer = adBreak.id;
    this.sample.adTagUrl = adBreak.tag ? adBreak.tag.url : undefined;
    if (this.sample.adTagUrl) {
      const adTagDetails = Utils.getHostnameAndPathFromUrl(this.sample.adTagUrl);
      this.sample.adTagServer = adTagDetails.hostname;
      this.sample.adTagPath = adTagDetails.path;
    }
    //this.sample.adWrapperCount = adBreak.adWrapperIds ? adBreak.adWrapperIds.length : 0;
  }

  clearAdBreakValues() {
    this.sample.adPosition = undefined;
    this.sample.adOffset = undefined;
    this.sample.adScheduleTime = undefined;
    this.sample.adReplaceContentDuration = undefined;
    this.sample.adPreloadOffset = undefined;
    this.sample.adSkipAfter = undefined;
    this.sample.adTagUrl = undefined;
    this.sample.adTagServer = undefined;
    this.sample.adTagPath = undefined;
    this.sample.adTagType = undefined;
    this.sample.adIsPersistent = undefined;
    this.sample.adWrapperCount = 0;
    this.sample.adIdPlayer = undefined;
  }

  setAnalyticsSampleValues() {
    this.sample.videoImpressionId = this.analytics.sample.impressionId;
    this.sample.analyticsVersion = __VERSION__;
    this.sample.autoplay = this.analytics.autoplay;
    this.sample.userAgent = this.analytics.sample.userAgent;
    this.sample.language = this.analytics.sample.language;
    this.sample.cdnProvider = this.analytics.sample.cdnProvider;
    this.sample.customData1 = this.analytics.sample.customData1;
    this.sample.customData2 = this.analytics.sample.customData2;
    this.sample.customData3 = this.analytics.sample.customData3;
    this.sample.customData4 = this.analytics.sample.customData4;
    this.sample.customData5 = this.analytics.sample.customData5;
    this.sample.customUserId = this.analytics.sample.customUserId;
    this.sample.domain = this.analytics.sample.domain;
    this.sample.experimentName = this.analytics.sample.experimentName;
    this.sample.pageLoadTime = this.analytics.pageLoadTime;
    this.sample.pageLoadType = this.analytics.pageLoadType;
    this.sample.path = this.analytics.sample.path;
    this.sample.player = this.analytics.sample.player;
    this.sample.playerKey = this.analytics.sample.playerKey;
    this.sample.playerTech = this.analytics.sample.playerTech;
    this.sample.playerStartupTime = this.analytics.sample.playerStartupTime;
    this.sample.version = this.analytics.sample.version;
    this.sample.screenHeight = this.analytics.sample.screenHeight;
    this.sample.screenWidth = this.analytics.sample.screenWidth;
    this.sample.size = this.analytics.sample.size;
    this.sample.userId = this.analytics.sample.userId;
    this.sample.videoId = this.analytics.sample.videoId;
    this.sample.videoTitle = this.analytics.sample.videoTitle;
    this.sample.videoWindowHeight = this.analytics.sample.videoWindowHeight;
    this.sample.videoWindowWidth = this.analytics.sample.videoWindowWidth;
  }


  clearValues() {
    this.sample.manifestDownloadTime = undefined;
    this.sample.adStartupTime = undefined;
    this.sample.timePlayed = 0;
    this.sample.timeHovered = undefined;
    this.sample.timeUntilHover = undefined;
    this.sample.timeInViewport = undefined;
    this.sample.percentageInViewport = undefined;
    this.sample.started = 0;
    this.sample.quartile1 = 0;
    this.sample.quartile3 = 0;
    this.sample.midpoint = 0;
    this.sample.completed = 0;
    this.sample.skipped = 0;
    this.sample.clicked = 0;
    this.sample.closed = 0;
    this.sample.clickPosition = undefined;
    this.sample.closePosition = undefined;
    this.sample.errorCode = undefined;
    this.sample.errorMessage = undefined;
    console.log('clearValues');
    console.log('   timePlayed: ' + this.sample.timePlayed);
    console.log('   timeInViewport: ' + this.sample.timeInViewport);
  }

  sendAnalyticsRequest(sample: AdSample) {
    if (this.analytics.licensing.status === AnalyticsLicensingStatus.DENIED) {
      return;
    }

    sample.adImpressionId = Utils.generateUUID();
    sample.time = Utils.getCurrentTimestamp();

    if (this.analytics.licensing.status === AnalyticsLicensingStatus.GRANTED) {
      if (this.analytics.licensing.isModuleAllowed(AdAnalytics.MODULE_NAME)) {
        return;
      }
      this.analytics.analyticsCall.sendAdRequest(sample, Utils.noOp);
    } else if (this.analytics.licensing.status === AnalyticsLicensingStatus.WAITING) {
      logger.log('Licensing callback still pending, waiting...');

      const copySample = {...sample};

      window.setTimeout(() => {
        this.analytics.analyticsCall.sendAdRequest(copySample, Utils.noOp);
      }, Analytics.LICENSE_CALL_PENDING_TIMEOUT);
    }
  }
}
