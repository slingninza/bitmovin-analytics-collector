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

  private analytics: Analytics;
  private adapter: AdAdapter;
  private viewportTracker: ViewportTracker;

  private adAnalyticsSample: AdAnalyticsSample = new AdAnalyticsSample();
  private adBreakSample: AdBreakSample = new AdBreakSample();
  private adSample: AdSample = new AdSample();

  private adBreak?: any;
  private adStartupTimestamp?: number;
  private beginPlayingTimestamp?: number;
  private enterViewportTimestamp?: number;
  private isPlaying: boolean = false;

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
    this.setAdBreak(event.adBreak);
    this.adStartupTimestamp = Utils.getCurrentTimestamp();
  }

  onAdBreakFinished(event: AdBreakEvent) {
    this.adBreakSample = this.createNewAdBreakSample();
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
    this.adSample.adStartupTime = this.adStartupTimestamp
      ? Utils.getCurrentTimestamp() - this.adStartupTimestamp
      : undefined;
    this.adSample.started = 1;
    this.adSample.timePlayed = 0;
    this.adSample.timeInViewport = 0;
    if (event.ad) {
      const ad = <LinearAd>event.ad;
      this.adSample.adSkippable = ad.skippable;
      this.adSample.adClickthroughUrl = ad.clickThroughUrl;
      this.adSample.adId = ad.id;
      this.adSample.adDuration = ad.duration;
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
        this.adSample.minSuggestedDuration = data.minSuggestedDuration;
        this.adSample.adSkipAfter = data.skipTimeOffset;
        this.adSample.surveyUrl = data.surveyUrl;
        this.adSample.adTitle = data.title;
        this.adSample.universalAdIdRegistry = data.universalAdIdRegistry;
        this.adSample.universalAdIdValue = data.universalAdIdValue;
        this.adSample.wrapperAdsCount = data.wrapperAdsCount;
        this.adSample.videoBitrate = data.vastMediaBitrate;
        this.adSample.adPlaybackHeight = data.vastMediaHeight;
        this.adSample.adPlaybackWidth = data.vastMediaWidth;
        this.adSample.streamFormat = data.contentType;
      }
    }

    this.startAd();
  }

  onAdFinished(event: AdEvent) {
    this.adSample.completed = 1;
    this.completeAd();
  }

  onAdSkipped(event: AdEvent) {
    this.adSample.skipped = 1;
    //not possible - getRemainingTime() is -1 at this point already
    //this.sample.skipPosition = currentTime;
    this.completeAd();
  }

  onAdError(event: ErrorEvent) {
    const {code, message, adBreak} = event.data ? event.data : event;
    this.adSample.errorCode = code;
    this.adSample.errorMessage = message;
    
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
    this.sendAnalyticsRequestAndCreateNewSample();
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) {}

  onAdClicked(event: AdClickedEvent) {
    this.adSample.clicked = 1;
    //this.sample.clickPosition = currentTime;
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
    if (!this.adBreak) {
      return;
    }

    this.updatePlayingTime();
    this.adSample.closed = 1;
    //this.sample.closePosition = currentTime;
    this.sendAnalyticsRequestAndCreateNewSample();
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
  }

  setAdBreak(adBreak) {
    this.adBreak = adBreak;
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
    this.adBreakSample.adScheduleTime = adBreak.scheduleTime;
    this.adBreakSample.adReplaceContentDuration = adBreak.replaceContentDuration;
    this.adBreakSample.adPreloadOffset = adBreak.preloadOffset;
    this.adBreakSample.adSkipAfter = adBreak.skipAfter;
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
    sample.percentageInViewport = !sample.timePlayed || sample.timePlayed === 0 ? undefined : Math.round(sample.timeInViewport || 0 / sample.timePlayed);
    this.analytics.backend.sendAdRequest(sample);
  }
}
