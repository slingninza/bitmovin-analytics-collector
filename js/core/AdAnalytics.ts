import {Analytics} from './Analytics';
import { AdSample } from '../types/AdSample';
import { AnalyticsLicensingStatus } from '../enums/AnalyticsLicensingStatus';
import Utils from '../utils/Utils';
import { logger } from '../utils/Logger';
import { AdAnalyticsCallbacks } from '../types/AdAnalyticsCallbacks';
import { Adapter } from '../types/Adapter';
import { ViewportTracker } from '../utils/ViewportTracker';
import { AdBreakEvent, AdClickedEvent, AdEvent, AdQuartileEvent, AdLinearityChangedEvent, ErrorEvent } from 'bitmovin-player';

declare var __VERSION__: any;

export class AdAnalytics implements AdAnalyticsCallbacks {
  static readonly MODULE_NAME = 'ads';

  private analytics: Analytics;
  private sample: AdSample = {};
  private container?: HTMLElement;
  private viewportTracker?: ViewportTracker;
  private adBreak?: any;
  private adModule?: string;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
  }

  setAdModule(adModule: string) {
    this.adModule = this.sample.adModule = adModule;
  }

  setContainer(container: HTMLElement) {
    if(this.viewportTracker) {
        this.viewportTracker.dispose();
    }
    this.container = container;
    this.viewportTracker = new ViewportTracker(this.container, () => this.onIntersectionChanged(), 0.5);
  }

  onIntersectionChanged() {
    console.log('Container visible: ' + this.isContainerInViewport());
  }

  isContainerInViewport(): boolean | undefined {
      return this.viewportTracker ? this.viewportTracker.isInViewport() : undefined;
  }

  onPlay(e) {
    console.log('onPlay');
  }

  onPause(e) {
    console.log('onPause');
  }

  onAdManifestLoaded(event: AdBreakEvent) {
    console.log('onAdManifestLoaded');
  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.setAdBreak(event.adBreak);
  }

  onAdBreakFinished(event: AdBreakEvent) {
    this.setAdBreak(undefined);
  }

  onAdStarted(event: AdEvent) {
    console.log('onAdStarted');
  }

  onAdFinished(event: AdEvent) {
    console.log('onAdFinished');
  }

  onAdSkipped(event: AdEvent) {
    console.log('onAdSkipped');
  }

  onAdError(event: ErrorEvent) {
    console.log('onAdError');
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) { }

  onAdClicked(event: AdClickedEvent) {
    console.log('onAdClicked');
  }

  onAdQuartile(event: AdQuartileEvent) {
    console.log('onAdQuartile');
  }

  onBeforeUnload() {
    console.log('onBeforeUnload');
  }

  sendAnalyticsRequestAndClearValues() {
    this.setAnalyticsSampleValues();
    this.sendAnalyticsRequest(this.sample);
    this.clearValues();
  }

  setAdBreak(adBreak) {
    this.adBreak = adBreak;
    this.clearAdBreakValues();

    // this.sample.adModule = this.analytics.adapter.getAnalyticsModule();

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
