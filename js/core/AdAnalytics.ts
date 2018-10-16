 import {Analytics} from './Analytics';
import {AdSample, AdAnalyticsSample, AdBreakSample} from '../types/AdSample';
import {AnalyticsLicensingStatus} from '../enums/AnalyticsLicensingStatus';
import * as Utils from '../utils/Utils';
import {logger} from '../utils/Logger';
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
import { Sample } from '../types/Sample';

declare var __VERSION__: any;

export class AdAnalytics {
  static readonly MODULE_NAME = 'ads';
  private static readonly TIMEOUT_CURRENT_TIME_INTERVAL = 100;

  private analytics: Analytics;
  private adapter: AdAdapter;
  private viewportTracker: ViewportTracker;

  private adAnalyticsSample: AdAnalyticsSample = new AdAnalyticsSample();
  private adBreakSample: AdBreakSample = new AdBreakSample();
  private adSample: AdSample = new AdSample();

  private adStartupTimestamp?: number;
  private beginPlayingTimestamp?: number;
  private enterViewportTimestamp?: number;
  private isPlaying: boolean = false;
  private currentTime?: number;
  private currentTimeInterval?: number;
  private adPodPosition: number = 0;

  constructor(analytics: Analytics, adapter: AdAdapter) {
    this.analytics = analytics;
    this.adapter = adapter;

    this.adapter.onAdStarted = (event) => this.onAdStarted(event);
    this.adapter.onAdFinished = (event) => this.onAdFinished(event);
    this.adapter.onAdBreakStarted = (event) => this.onAdBreakStarted(event);
    this.adapter.onAdBreakFinished = (event) => this.onAdBreakFinished(event);
    this.adapter.onAdClicked = (event) => this.onAdClicked(event);
    this.adapter.onAdError = (event) => this.onAdError(event);
    this.adapter.onAdManifestLoaded = (event) => this.onAdManifestLoaded(event);
    this.adapter.onPlay = () => this.onPlay();
    this.adapter.onPause = () => this.onPause();
    this.adapter.onBeforeUnload = () => this.onBeforeUnload();
    this.adapter.onAdSkipped = (event) => this.onAdSkipped(event);
    this.adapter.onAdQuartile = (event) => this.onAdQuartile(event);

    this.viewportTracker = new ViewportTracker(this.adapter.getContainer(), () => this.onIntersectionChanged(), 0.5);
  }

  onIntersectionChanged() {
    if (this.isContainerInViewport()) {
      this.enterViewportTimestamp = Utils.getCurrentTimestamp();
    } else {
      if (this.enterViewportTimestamp) {
        this.adSample.timeInViewport =
          (this.adSample.timeInViewport || 0) + Utils.getCurrentTimestamp() - this.enterViewportTimestamp;
      }
    }
  }

  isContainerInViewport(): boolean {
    return this.viewportTracker ? this.viewportTracker.isInViewport() : true;
  }

  onPlay() {
    if (this.adapter && this.adapter.isLinearAdActive()) {
      this.startAd();
    }
  }

  private updatePlayingTime() {
    if (this.beginPlayingTimestamp && this.isPlaying) {
      if(this.adSample.timePlayed !== undefined) {
        this.adSample.timePlayed += Utils.getCurrentTimestamp() - this.beginPlayingTimestamp;
      }
      if (this.isContainerInViewport() && this.enterViewportTimestamp && this.adSample.timeInViewport !== undefined) {
        this.adSample.timeInViewport += Utils.getCurrentTimestamp() - this.enterViewportTimestamp;
      }
    }
  }

  onPause() {
    if (this.adapter && this.adapter.isLinearAdActive()) {
      this.updatePlayingTime();
      this.isPlaying = false;
    }
  }

  onAdManifestLoaded(event: AdBreakEvent) {  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.adPodPosition = 0;
    this.setAdBreak(event.adBreak);
    this.adStartupTimestamp = Utils.getCurrentTimestamp();
  }

  onAdBreakFinished(event: AdBreakEvent) {
    this.adBreakSample = this.createNewAdBreakSample();
  }

  private startAd() {
    this.adSample.started = 1;
    this.adSample.timePlayed = 0;
    this.adSample.timeInViewport = 0;
    this.adSample.adPodPosition = this.adPodPosition;
    this.beginPlayingTimestamp = Utils.getCurrentTimestamp();
    this.enterViewportTimestamp = Utils.getCurrentTimestamp();
    this.isPlaying = true;
    this.currentTime = 0;
    this.adPodPosition++;

    this.currentTimeInterval = setInterval(() => {
      if(this.adSample.adDuration !== undefined && this.adSample.adDuration > 0 && this.adapter.isLinearAdActive()) {
          this.currentTime = Utils.calculateTime(Math.max(this.adapter.currentTime(), 0));
      }
    }, AdAnalytics.TIMEOUT_CURRENT_TIME_INTERVAL);
  }

  onAdStarted(event: AdEvent) {
    if (!event.ad.isLinear) {
      return;
    }
    this.adSample.adStartupTime = this.adStartupTimestamp
      ? Utils.getCurrentTimestamp() - this.adStartupTimestamp
      : undefined;

    this.startAd();

    if (event.ad) {
      const ad = <LinearAd>event.ad;
      this.adSample.adSkippable = ad.skippable;
      this.adSample.adClickthroughUrl = ad.clickThroughUrl;
      this.adSample.adId = ad.id;
      this.adSample.adDuration = Utils.calculateTime(ad.duration);
      this.adSample.mediaUrl = ad.mediaFileUrl;
      const mediaUrlDetails = Utils.getHostnameAndPathFromUrl(this.adSample.mediaUrl || '');
      this.adSample.mediaPath = mediaUrlDetails.path;
      this.adSample.mediaServer = mediaUrlDetails.hostname;
      this.adSample.isLinear = ad.isLinear;
      const data = <AdData>(<any>event.ad).additionalData;
      if (data) {
        this.adSample.adSystem = data.adSystem;
        this.adSample.advertiserName = data.advertiserName;
        this.adSample.apiFramework = data.apiFramework;
        this.adSample.creativeAdId = data.creativeAdId;
        this.adSample.creativeId = data.creativeId;
        this.adSample.dealId = data.dealId;
        this.adSample.adDescription = data.adDescription;
        this.adSample.minSuggestedDuration = Utils.calculateTimeWithUndefined(data.minSuggestedDuration);
        this.adSample.adSkipAfter = this.parseSkipAfter(data.skipTimeOffset);
        this.adSample.surveyUrl = data.surveyUrl;
        this.adSample.adTitle = data.title;
        this.adSample.universalAdIdRegistry = data.universalAdIdRegistry;
        this.adSample.universalAdIdValue = data.universalAdIdValue;
        this.adSample.wrapperAdsCount = data.wrapperAdsCount;
        this.adSample.videoBitrate = data.vastMediaBitrate === undefined ? undefined : data.vastMediaBitrate * 1000;
        this.adSample.adPlaybackHeight = data.vastMediaHeight;
        this.adSample.adPlaybackWidth = data.vastMediaWidth;
        this.adSample.streamFormat = data.contentType;
      }
    }
  }

  onAdFinished(event: AdEvent) {
    this.adSample.completed = 1;
    this.completeAd(this.adSample.adDuration);
  }

  onAdSkipped(event: AdEvent) {
    this.adSample.skipped = 1;
    this.adSample.skipPosition = this.currentTime;
    this.adSample.skipPercentage = Utils.calculatePercentage(this.adSample.skipPosition, this.adSample.adDuration);
    this.completeAd(this.adSample.skipPosition);
  }

  onAdError(event: ErrorEvent) {
    const {code, message, adBreak} = event.data ? event.data : event;
    this.adSample.errorCode = code;
    this.adSample.errorMessage = message;
    
    if(adBreak) {
      this.setAdBreak(adBreak);
    }

    this.adSample.errorPosition = this.currentTime;
    this.adSample.errorPercentage = Utils.calculatePercentage(this.adSample.errorPosition, this.adSample.adDuration);
    this.completeAd(this.adSample.errorPosition);
  }

  private completeAd(exitPosition?: number) {
    
    clearInterval(this.currentTimeInterval);
    this.adSample.exitPosition = exitPosition;
    this.adSample.playPercentage = Utils.calculatePercentage(this.adSample.exitPosition, this.adSample.adDuration);
    //reset startupTimestamp for the next ad, in case there are multiple ads in one ad break
    this.adStartupTimestamp = Utils.getCurrentTimestamp();
    this.updatePlayingTime();
    this.isPlaying = false;
    this.sendAnalyticsRequestAndCreateNewSample();
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) {}

  onAdClicked(event: AdClickedEvent) {
    this.adSample.clicked = 1;
    this.adSample.clickPosition = this.currentTime;
    this.adSample.clickPercentage = Utils.calculatePercentage(this.adSample.clickPosition, this.adSample.adDuration);
  }

  onAdQuartile(event: AdQuartileEvent) {
    if (event.quartile === AdQuartile.FIRST_QUARTILE) {
      this.adSample.quartile1 = 1;
    } else if (event.quartile === AdQuartile.MIDPOINT) {
      this.adSample.midpoint = 1;
    } else if (event.quartile === AdQuartile.THIRD_QUARTILE) {
      this.adSample.quartile3 = 1;
    }
  }

  onBeforeUnload() {
    if (!this.adapter.isLinearAdActive()) {
      return;
    }

    this.adSample.closed = 1;
    this.adSample.closePosition = this.currentTime;
    this.adSample.closePercentage = Utils.calculatePercentage(this.adSample.closePosition, this.adSample.adDuration);
    this.completeAd(this.adSample.closePosition);
  }

  sendAnalyticsRequestAndCreateNewSample() {
    this.adAnalyticsSample = this.createNewAdAnalyticsSample(this.analytics.sample);
    this.sendAnalyticsRequest({
      ...this.adAnalyticsSample, 
      ...this.adBreakSample, 
      ...this.adSample, 
      // the ad can override the skipAfter - if it isn't set, we use the adBreaks value as a fallback
      adSkipAfter: this.adSample.adSkipAfter || this.adBreakSample.adSkipAfter
    });
    this.adSample = this.createNewAdSample();
    this.currentTime = undefined;
  }

  setAdBreak(adBreak) {
    this.adBreakSample = this.createNewAdBreakSample();

    if (!adBreak) {
      return;
    }

    if(adBreak.vastResponse) {
      //should always be resolved at that point
      adBreak.vastResponse.then((vastResponse) => this.adBreakSample.manifestDownloadTime = Math.round(vastResponse.downloadTime * 1000));
    }

    if (adBreak.position === 'pre' || adBreak.position === 'post') {
      this.adBreakSample.adPosition = adBreak.position;
    } else {
      this.adBreakSample.adPosition = 'mid';
      this.adBreakSample.adOffset = adBreak.position;
    }
    this.adBreakSample.adScheduleTime = Utils.calculateTimeWithUndefined(adBreak.scheduleTime);
    this.adBreakSample.adReplaceContentDuration = Utils.calculateTimeWithUndefined(adBreak.replaceContentDuration);
    this.adBreakSample.adPreloadOffset = Utils.calculateTimeWithUndefined(adBreak.preloadOffset);
    this.adBreakSample.adSkipAfter = this.parseSkipAfter(adBreak.skipAfter);
    this.adBreakSample.adTagType = adBreak.tag ? adBreak.tag.type : undefined;
    this.adBreakSample.adIsPersistent = adBreak.persistent;
    this.adBreakSample.adIdPlayer = adBreak.id;
    this.adBreakSample.adTagUrl = adBreak.tag ? adBreak.tag.url : undefined;
    if (this.adBreakSample.adTagUrl) {
      const adTagDetails = Utils.getHostnameAndPathFromUrl(this.adBreakSample.adTagUrl);
      this.adBreakSample.adTagServer = adTagDetails.hostname;
      this.adBreakSample.adTagPath = adTagDetails.path;
    }
  }

  parseSkipAfter(skipAfter?: number) {
    if(skipAfter === undefined) {
      return undefined;
    }
    if(skipAfter === -1) {
      return skipAfter;
    }
    return Utils.calculateTime(skipAfter);
  }

  createNewAdBreakSample() {
    return new AdBreakSample();
  }

  createNewAdAnalyticsSample(analyticsSample: Sample): AdAnalyticsSample {
    
    return {
      ...new AdAnalyticsSample(analyticsSample),
      analyticsVersion: __VERSION__,
      adModule: this.adapter.getAdModule(),
      playerStartupTime: this.analytics.playerStartupTime,
      pageLoadTime: this.analytics.pageLoadTime,
      autoplay: this.analytics.autoplay,
      pageLoadType: Utils.getPageLoadType()
    }
  }

  createNewAdSample() {
    return new AdSample();
  }

  sendAnalyticsRequest(sample: (AdAnalyticsSample & AdSample & AdBreakSample)) {

    sample.time = Utils.getCurrentTimestamp();
    sample.adImpressionId = Utils.generateUUID();
    sample.percentageInViewport = Utils.calculatePercentage(sample.timeInViewport, sample.timePlayed);
    sample.adSkippable = sample.adSkipAfter === undefined ? undefined : sample.adSkipAfter >= 0;
    this.analytics.backend.sendAdRequest(sample);
  }
}
