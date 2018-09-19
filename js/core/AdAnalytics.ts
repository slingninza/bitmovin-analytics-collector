import { Analytics } from './Analytics';
import { AdSample } from '../types/ads/AdSample';
import { AdCallbacks } from '../types/ads/AdCallbacks';
import Utils from '../utils/Utils';
import { AdBreakEvent, AdClickedEvent, ErrorEvent, AdEvent, AdLinearityChangedEvent, AdQuartileEvent, AdQuartile, AdBreak } from 'bitmovin-player';
import { CreativeType } from '../enums/ads/CreativeType';
import { mapStringToStrategyType } from '../enums/ads/StrategyType';

declare var __VERSION__: any;

export class AdAnalytics implements AdCallbacks {
  private analytics: Analytics;
  private currentAdBreak: AdBreak | null;
  private currentAdSample: AdSample | null;
  private currentAdSampleStartTime: number;
  private adBreaks : Array<AdBreak>;
  private samples: Array<AdSample>;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
    this.currentAdBreak = null;
    this.currentAdSample = null;
    this.adBreaks = [];
    this.samples = [];
    this.currentAdSampleStartTime = 0;
  }

  generateNewAdImpressionId() {
    return Utils.generateUUID();
  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.currentAdBreak = event.adBreak;
  }
  onAdBreakFinished(event: AdBreakEvent) {
    this.currentAdBreak = null;
  }

  onAdStarted(event: AdEvent) {
    const ad = event.ad;
    const sample: AdSample = this.setupSample();
    sample.clickThroughUrl = ad.clickThroughUrl;
    sample.mediaUrl = ad.mediaFileUrl;
    sample.duration = ad.duration;
    sample.creativeAdId = ad.id;
    sample.started = true;
    if (ad.isLinear) {
      sample.creativeType = CreativeType.LINEAR;
    }
    if (this.currentAdBreak) {
      sample.strategy = mapStringToStrategyType(this.currentAdBreak.tag.type);
    }
    this.samples.push(sample);
    this.currentAdSample = sample;
    this.currentAdSampleStartTime = event.timestamp;
  }

  onAdFinished(event: AdEvent) {
    if (this.currentAdSample) {
      this.currentAdSample.completed = event.timestamp;
      this.currentAdSample.played = event.timestamp - this.currentAdSampleStartTime;
      debugger;
      // TODO: Send AdAnalyticsRequest
      this.currentAdSample = null;
    }
  }


  onAdClicked(event: AdClickedEvent) {
    const sample = {
      clicked: true,
      clickThroughUrl: event.clickThroughUrl,
      clickedPosition: event.timestamp
    }
  }

  onAdError(event: ErrorEvent) {
    // Is this error really related to the current adBreak??
    if (!this.currentAdSample) {
      this.currentAdSample = this.setupSample();
    }

    this.currentAdSample.errorCode = event.code;
    // TODO: Send AdAnalyticsRequest
    this.currentAdSample = null;
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) {
    if (this.currentAdSample && event.isLinear) {
      this.currentAdSample.creativeType = CreativeType.LINEAR;
    }
    // TODO: set creative type for nonlinear ads
  }

  onAdManifestLoaded(event: AdBreakEvent) {
    this.adBreaks.push(event.adBreak);
  }

  onAdQuartile(event: AdQuartileEvent) {
    const sample = this.currentAdSample;
    if (!sample) {
      return;
    }
    if (event.quartile === AdQuartile.FIRST_QUARTILE) {
      sample.quartile1 = event.timestamp;
    } else if (event.quartile === AdQuartile.MIDPOINT) {
      sample.midpoint = event.timestamp;
    } else if (event.quartile === AdQuartile.THIRD_QUARTILE) {
      sample.quartile3 = event.timestamp
    }
  }

  onAdSkipped(event: AdEvent) {
    if (this.currentAdSample) {
      this.currentAdSample.skipped = true;
      this.currentAdSample.skippedPosition = event.timestamp;
    }
  }

  setupSample() {
    const sample: AdSample = {
      adImpressionId: this.generateNewAdImpressionId(),
      adLoadTime: 0,
      adSystem: '',
      advertiserName: '',
      analyticsVersion: __VERSION__,
      audioBitrate: 0,
      autoplay: false,
      closed: false,
      completed: 0,
      domain: Utils.sanitizePath(window.location.hostname),
      duration: 0,
      language: navigator.language || (navigator as any).userLanguage,
      manifestDownloadTime: 0,
      minSuggestedDuration: 0,
      pageLoadType: this.analytics.getPageLoadType(),
      path: Utils.sanitizePath(window.location.pathname),
      played: 0,
      screenWidth: screen.width,
      screenHeight: screen.height,
      time: 0,
      userAgent: navigator.userAgent,
      videoDuration: 0
    };
    this.setVideoSampleData(sample);
    return sample;
  }

  setVideoSampleData(sample: AdSample) {
    const videoSample = this.analytics.getSample();
    sample.cdnProvider = videoSample.cdnProvider;
    sample.pageLoadTime = videoSample.pageLoadTime;
    sample.pageLoadType = videoSample.pageLoadType;
    sample.player = videoSample.player;
    sample.playerKey = videoSample.key;
    sample.playerStartupTime = videoSample.playerStartupTime;
    sample.playerTech = videoSample.playerTech;
    sample.playerVersion = videoSample.version;
    sample.size = videoSample.size;
    sample.startupTime = videoSample.startupTime;
    sample.userId = videoSample.userId;
    sample.videoId = videoSample.videoId;
    sample.videoImpressionId = videoSample.impressionId;
    sample.videoDuration = videoSample.videoDuration;
    sample.videoWindowWidth = videoSample.videoWindowWidth;
    sample.videoWindowHeight = videoSample.videoWindowHeight;
    sample.videoPlaybackWidth = videoSample.videoPlaybackWidth;
    sample.videoPlaybackHeight = videoSample.videoPlaybackHeight;
    sample.videoBitrate = videoSample.videoBitrate;
  }

  //   sendAnalyticsRequestAndClearValues() {
  //     this.sendAnalyticsRequest();
  //     this.clearValues();
  //   }

  //   sendAnalyticsRequest() {
  //     if (this.analytics.licensing === 'denied') {
  //       return;
  //     }

  //     if (this.licensing === 'granted') {
  //       this.sample.time = Utils.getCurrentTimestamp();

  //       if (!this.isCastClient && !this.isCastReceiver) {
  //         this.analyticsCall.sendRequest(this.sample, Utils.noOp);
  //         return;
  //       }

  //       if (!this.isAllowedToSendSamples) {
  //         const copySample = {...this.sample};
  //         this.samplesQueue.push(copySample);
  //       } else {
  //         for (let i = 0; i < this.samplesQueue.length; i++) {
  //           this.analyticsCall.sendRequest(this.samplesQueue[i], Utils.noOp);
  //         }
  //         this.samplesQueue = [];

  //         this.analyticsCall.sendRequest(this.sample, Utils.noOp);
  //       }
  //     } else if (this.licensing === 'waiting') {
  //       this.sample.time = Utils.getCurrentTimestamp();

  //       logger.log('Licensing callback still pending, waiting...');

  //       const copySample = {...this.sample};

  //       window.setTimeout(() => {
  //         this.analyticsCall.sendRequest(copySample, Utils.noOp);
  //       }, Analytics.LICENSE_CALL_PENDING_TIMEOUT);
  //     }
}
