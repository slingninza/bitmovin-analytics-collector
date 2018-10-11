import {Analytics} from './Analytics';
import {AdSample} from '../types/AdSample';
import {AnalyticsLicensingStatus} from '../enums/AnalyticsLicensingStatus';
import Utils from '../utils/Utils';
import {logger} from '../utils/Logger';
import {AdAnalyticsCallbacks} from '../types/AdAnalyticsCallbacks';
import {Adapter} from '../types/Adapter';
import {ViewportTracker} from '../utils/ViewportTracker';
import {
  AdBreakEvent,
  AdClickedEvent,
  AdEvent,
  AdQuartileEvent,
  AdLinearityChangedEvent,
  ErrorEvent,
  AdQuartile,
  LinearAd,
  VastResponse,
} from 'bitmovin-player';
import {AdAdapter} from '../types/AdAdapter';
import {AdData} from '../types/AdData';

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
    started: 0
  };
  private container?: HTMLElement;
  private viewportTracker?: ViewportTracker;
  private adBreak?: any;
  private adStartupTimestamp?: number;
  private beginPlayingTimestamp?: number;
  private enterViewportTimestamp?: number;
  private isPlaying: boolean = false;
  private adapter?: AdAdapter;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
  }

  setAdapter(adAdapter: AdAdapter) {
    this.adapter = adAdapter;

    if (this.viewportTracker) {
      this.viewportTracker.dispose();
    }

    this.container = this.adapter.getContainer();
    this.sample.adModule = this.adapter.getAdModule();
    if (this.container) {
      this.viewportTracker = new ViewportTracker(this.container, () => this.onIntersectionChanged(), 0.5);
    }
  }

  onIntersectionChanged() {
    if (this.isContainerInViewport()) {
      this.enterViewportTimestamp = Utils.getCurrentTimestamp();
    } else {
      if (this.enterViewportTimestamp) {
        this.sample.timeInViewport =
          (this.sample.timeInViewport || 0) + Utils.getCurrentTimestamp() - this.enterViewportTimestamp;
      }
    }
  }

  isContainerInViewport(): boolean | undefined {
    return this.viewportTracker ? this.viewportTracker.isInViewport() : true;
  }

  onPlay(e) {
    if (this.adapter && this.adapter.isLinearAdActive()) {
      this.startAd();
    }
  }

  private updatePlayingTime() {
    if (this.beginPlayingTimestamp && this.isPlaying) {
      if(this.sample.timePlayed !== undefined) {
        this.sample.timePlayed += Utils.getCurrentTimestamp() - this.beginPlayingTimestamp;
      }
      if (this.isContainerInViewport() && this.enterViewportTimestamp && this.sample.timeInViewport !== undefined) {
        this.sample.timeInViewport += Utils.getCurrentTimestamp() - this.enterViewportTimestamp;
      }
    }
  }

  onPause(e) {
    if (this.adapter && this.adapter.isLinearAdActive()) {
      this.updatePlayingTime();
      this.isPlaying = false;
    }
  }

  onAdManifestLoaded(event: AdBreakEvent) {  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.setAdBreak(event.adBreak);
    this.adStartupTimestamp = Utils.getCurrentTimestamp();
  }

  onAdBreakFinished(event: AdBreakEvent) {
    this.setAdBreak(undefined);
  }

  private startAd() {
    this.beginPlayingTimestamp = Utils.getCurrentTimestamp();
    this.enterViewportTimestamp = Utils.getCurrentTimestamp();
    this.isPlaying = true;
  }

  onAdStarted(event: AdEvent) {
    if (!event.ad.isLinear) {
      return;
    }
    this.sample.adStartupTime = this.adStartupTimestamp
      ? Utils.getCurrentTimestamp() - this.adStartupTimestamp
      : undefined;
    this.sample.started = 1;
    this.sample.timePlayed = 0;
    this.sample.timeInViewport = 0;
    if (event.ad) {
      const ad = <LinearAd>event.ad;
      this.sample.adSkippable = ad.skippable;
      this.sample.adClickthroughUrl = ad.clickThroughUrl;
      this.sample.adId = ad.id;
      this.sample.adDuration = ad.duration;
      this.sample.mediaUrl = ad.mediaFileUrl;
      const mediaUrlDetails = Utils.getHostnameAndPathFromUrl(this.sample.mediaUrl || '');
      this.sample.mediaPath = mediaUrlDetails.path;
      this.sample.mediaServer = mediaUrlDetails.hostname;
      this.sample.isLinear = ad.isLinear;
      const data = <AdData>(<any>event.ad).additionalData;
      if (data) {
        this.sample.adSystem = data.adSystem;
        this.sample.advertiserName = data.advertiserName;
        this.sample.apiFramework = data.apiFramework;
        this.sample.creativeAdId = data.creativeAdId;
        this.sample.creativeId = data.creativeId;
        this.sample.dealId = data.dealId;
        this.sample.adDescription = data.adDescription;
        this.sample.minSuggestedDuration = data.minSuggestedDuration;
        this.sample.adSkipAfter = data.skipTimeOffset || this.sample.adSkipAfter;
        this.sample.surveyUrl = data.surveyUrl;
        this.sample.adTitle = data.title;
        this.sample.universalAdIdRegistry = data.universalAdIdRegistry;
        this.sample.universalAdIdValue = data.universalAdIdValue;
        this.sample.wrapperAdsCount = data.wrapperAdsCount;
        this.sample.videoBitrate = data.vastMediaBitrate;
        this.sample.adPlaybackHeight = data.vastMediaHeight;
        this.sample.adPlaybackWidth = data.vastMediaWidth;
        this.sample.streamFormat = data.contentType;
      }
    }

    this.startAd();
  }

  onAdFinished(event: AdEvent) {
    this.sample.completed = 1;
    this.completeAd();
  }

  onAdSkipped(event: AdEvent) {
    this.sample.skipped = 1;
    //not possible - getRemainingTime() is -1 at this point already
    //this.sample.skipPosition = currentTime;
    this.completeAd();
  }

  onAdError(event: ErrorEvent) {
    const {code, message, adBreak} = event.data ? event.data : event;
    this.sample.errorCode = code;
    this.sample.errorMessage = message;
    
    if(adBreak) {
      this.setAdBreak(adBreak);
    }

    this.completeAd();
  }

  private completeAd() {
    //reset startupTimestamp for the next ad, in case there are multiple ads in one ad break
    this.adStartupTimestamp = Utils.getCurrentTimestamp();
    this.updatePlayingTime();
    this.isPlaying = false;
    this.sendAnalyticsRequestAndClearValues();
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) {}

  onAdClicked(event: AdClickedEvent, currentTime: number) {
    this.sample.clicked = 1;
    this.sample.clickPosition = currentTime;
  }

  onAdQuartile(event: AdQuartileEvent) {
    if (event.quartile === AdQuartile.FIRST_QUARTILE) {
      this.sample.quartile1 = 1;
    } else if (event.quartile === AdQuartile.MIDPOINT) {
      this.sample.midpoint = 1;
    } else if (event.quartile === AdQuartile.THIRD_QUARTILE) {
      this.sample.quartile3 = 1;
    }
  }

  onBeforeUnload(currentTime: number) {
    if (!this.adBreak) {
      return;
    }

    this.updatePlayingTime();
    this.sample.closed = 1;
    this.sample.closePosition = currentTime;
    this.sendAnalyticsRequestAndClearValues();
  }

  sendAnalyticsRequestAndClearValues() {
    this.setAnalyticsSampleValues();
    this.sendAnalyticsRequest({...this.sample});
    this.clearValues();
  }

  setAdBreak(adBreak) {
    this.adBreak = adBreak;
    this.clearAdBreakValues();

    if (!adBreak) {
      return;
    }

    if(adBreak.vastResponse) {
      //should always be resolved at that point
      adBreak.vastResponse.then((vastResponse) => this.sample.manifestDownloadTime = Math.round(vastResponse.downloadTime * 1000));
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
    this.sample.wrapperAdsCount = 0;
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
    this.sample.key = this.analytics.sample.key;
    this.sample.pageLoadTime = this.analytics.pageLoadTime;
    this.sample.pageLoadType = this.analytics.setPageLoadType();
    this.sample.path = this.analytics.sample.path;
    this.sample.player = this.analytics.sample.player;
    this.sample.playerKey = this.analytics.sample.playerKey;
    this.sample.playerTech = this.analytics.sample.playerTech;
    this.sample.playerStartupTime = this.analytics.playerStartupTime;
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
    this.sample.adSkippable = undefined;
    this.sample.adClickthroughUrl = undefined;
    this.sample.adId = undefined;
    this.sample.adDuration = undefined;
    this.sample.mediaUrl = undefined;
    this.sample.mediaPath = undefined;
    this.sample.mediaServer = undefined;
    this.sample.isLinear = undefined;
    this.sample.adSystem = undefined;
    this.sample.advertiserName = undefined;
    this.sample.apiFramework = undefined;
    this.sample.creativeAdId = undefined;
    this.sample.creativeId = undefined;
    this.sample.dealId = undefined;
    this.sample.adDescription = undefined;
    this.sample.minSuggestedDuration = undefined;
    this.sample.adSkipAfter = undefined;
    this.sample.surveyUrl = undefined;
    this.sample.adTitle = undefined;
    this.sample.universalAdIdRegistry = undefined;
    this.sample.universalAdIdValue = undefined;
    this.sample.wrapperAdsCount = undefined;
    this.sample.videoBitrate = undefined;
    this.sample.adPlaybackHeight = undefined;
    this.sample.adPlaybackWidth = undefined;
    this.sample.streamFormat = undefined;

    this.sample.manifestDownloadTime = undefined;
    this.sample.adStartupTime = undefined;
    this.sample.timePlayed = undefined;
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

    this.sample.time = Utils.getCurrentTimestamp();
    this.sample.adImpressionId = Utils.generateUUID();
    sample.percentageInViewport = !sample.timePlayed || sample.timePlayed === 0 ? undefined : Math.round(sample.timeInViewport || 0 / sample.timePlayed);
    const copySample = { ...this.sample };
    this.analytics.backend.sendAdRequest(copySample);
  }
}
