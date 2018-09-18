import { Analytics } from './Analytics';
import { AdSample } from '../types/ads/AdSample';
import { AdCallbacks } from '../types/ads/AdCallbacks';
import Utils from '../utils/Utils';
import { AdBreakEvent, AdClickedEvent, ErrorEvent, AdEvent, AdLinearityChangedEvent, AdQuartileEvent, AdQuartile } from 'bitmovin-player';
import { CreativeType } from '../enums/ads/CreativeType';

declare var __VERSION__: any;

export class AdAnalytics implements AdCallbacks {
  private analytics: Analytics;
  private sample: AdSample;
  private manifestLoaded: boolean;

  private adStartTime: number;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
    this.manifestLoaded = false;
    this.adStartTime = 0;
    this.sample = {};
    this.setupSample();
  }

  generateNewAdImpressionId() {
    this.sample.adImpressionId = Utils.generateUUID();
  }

  onAdBreakFinished(event: AdBreakEvent) {
    // TODO: tbi
    debugger;
  }

  onAdStarted(event: AdEvent) {
    this.generateNewAdImpressionId();
    this.sample.started = true;
    this.adStartTime = event.timestamp;
    debugger;
  }

  onAdFinished(event: AdEvent) {
    this.sample.completed = event.timestamp;
    this.sample.played = event.timestamp - this.adStartTime;
    this.setVideoSampleData();
    // TODO: Send AdAnalyticsRequest
    debugger;
  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.sample.started = true;
  }

  onAdClicked(event: AdClickedEvent) {
    this.sample.clicked = event.timestamp;
    this.sample.clickThroughUrl = event.clickThroughUrl;
    this.sample.clickedPosition = event.timestamp;
  }

  onAdError(event: ErrorEvent) {
    this.sample.errorCode = event.code;
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) {
    if (event.isLinear) {
      this.sample.creativeType = CreativeType.LINEAR;
    }
    // TODO: set creative type for nonlinear ads
  }

  onAdManifestLoaded(event: any) {
    this.manifestLoaded = true;
    this.sample.strategy = event.adBreak.tag.type;
    this.sample.manifestDownloadTime = event.timestamp;
    // TODO: calculate manifest download time + add relevant info to adSample
    debugger;
  }

  onAdQuartile(event: AdQuartileEvent) {
    if (event.quartile === AdQuartile.FIRST_QUARTILE) {
      this.sample.quartile1 = event.timestamp;
    } else if (event.quartile === AdQuartile.MIDPOINT) {
      this.sample.midpoint = event.timestamp;
    } else if (event.quartile === AdQuartile.THIRD_QUARTILE) {
      this.sample.quartile3 = event.timestamp
    }
  }

  onAdSkipped(event: AdEvent) {
    this.sample.skipped = true;
    this.sample.skippedPosition = event.timestamp;
  }

  onOverlayAdStarted(event: AdEvent) {
    // TODO: tbi
    debugger;
  }

  clearAdSampleValues() {
    this.sample.adLoadTime = 0;
    this.sample.adSystem = '';
    this.sample.advertiserName = '';
    this.sample.completed = 0;
    this.sample.duration = 0;
    this.sample.midpoint = 0;
    this.sample.minSuggestedDuration = 0;
    this.sample.played = 0;
    this.sample.quartile1 = 0;
    this.sample.quartile3 = 0;
    this.sample.started = false;
    this.sample.time = 0;
    this.sample.videoDuration = 0;
  }

  setupSample() {
    this.sample = {
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
    };
  }

  setVideoSampleData() {
    const videoSample = this.analytics.getSample();
    this.sample.analyticsVersion = videoSample.analyticsVersion;
    this.sample.cdnProvider = videoSample.cdnProvider;
    this.sample.pageLoadTime = videoSample.pageLoadTime;
    this.sample.pageLoadType = videoSample.pageLoadType;
    this.sample.player = videoSample.player;
    this.sample.playerKey = videoSample.key;
    this.sample.playerStartupTime = videoSample.playerStartupTime;
    this.sample.playerTech = videoSample.playerTech;
    this.sample.playerVersion = videoSample.version;
    this.sample.size = videoSample.size;
    this.sample.startupTime = videoSample.startupTime;
    this.sample.userId = videoSample.userId;
    this.sample.videoId = videoSample.videoId;
    this.sample.videoImpressionId = videoSample.impressionId;
    this.sample.videoDuration = videoSample.videoDuration;
    this.sample.videoWindowWidth = videoSample.videoWindowWidth;
    this.sample.videoWindowHeight = videoSample.videoWindowHeight;
    this.sample.videoPlaybackWidth = videoSample.videoPlaybackWidth;
    this.sample.videoPlaybackHeight = videoSample.videoPlaybackHeight;
    this.sample.videoBitrate = videoSample.videoBitrate;
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
