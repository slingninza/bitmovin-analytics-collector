import { Analytics } from "./Analytics";
import { AdSample } from "../types/AdSample";
import { AdCallbacks } from "../types/AdCallbacks";
import Utils from '../utils/Utils';
import { AdBreakEvent, AdClickedEvent, ErrorEvent, AdEvent, AdLinearityChangedEvent, AdQuartileEvent, AdQuartile } from 'bitmovin-player';


export class AdAnalytics implements AdCallbacks {
  private analytics: Analytics;
  private sample: AdSample;
  private manifestLoaded: boolean;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
    this.manifestLoaded = false;
    this.sample = {};
    this.setupSample();
  }

  generateNewAdImpressionId() {
    this.sample.adImpressionId = Utils.generateUUID();
  }

  setVideoSampleData() {
    const videoSample = this.analytics.getSample();
    this.sample.analyticsVersion = videoSample.analyticsVersion;
    this.sample.player = videoSample.player;
    this.sample.playerKey = videoSample.playerKey;
    this.sample.playerStartupTime = videoSample.playerStartupTime;
    this.sample.playerTech = videoSample.playerTech;
    this.sample.playerVersion = videoSample.version;
    this.sample.cdnProvider = videoSample.cdnProvider;
    this.sample.userId = videoSample.userId;
    this.sample.videoId = videoSample.videoId;
  }

  onAdBreakFinished(event: AdBreakEvent) {
    debugger;
  }

  onAdStarted(event: AdEvent) {
    this.sample.started = true;
    debugger;
  }

  onAdFinished(event: AdEvent) {
    this.sample.completed = event.timestamp;
    // TODO: Send AdAnalyticsRequest
    debugger;
  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.sample.started = true;
  }

  onAdClicked(event: AdClickedEvent) {
    this.sample.clicked = event.timestamp;
    debugger;
  }

  onAdError(event: ErrorEvent) {
    this.sample.errorCode = event.code;
    // TODO: Send AdAnalyticsRequest
    debugger;
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) {
    debugger;
  }

  onAdManifestLoaded(event: any) {
    debugger;
    this.generateNewAdImpressionId();
    const videoSample = this.analytics.getSample();
    this.sample.videoId = videoSample.videoId;
    this.sample.videoImpressionId = videoSample.impressionId;

    if (event.vastResponse) { // event is of type ImaAdBreak
      event.adBreak.vastResponse.then(response => console.log(response)); // how to get Ad Id from ad manifest, IMA ??
    }
    this.manifestLoaded = true;
    this.sample.strategy = event.adBreak.tag.type;
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
    debugger;
  }

  onOverlayAdStarted(event: AdEvent) {
    debugger;
  }

  clearAdSampleValues() {
    this.sample.playerStartupTime = 0;
    this.sample.videoDuration = 0;
    this.sample.played = 0;
    this.sample.started = false;
    this.sample.manifestDownloadTime = 0;
    this.sample.startupTime = 0;
  }

  setupSample() {
    this.sample = {
      domain: Utils.sanitizePath(window.location.hostname),
      path: Utils.sanitizePath(window.location.pathname),
      language: navigator.language || (navigator as any).userLanguage,
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      videoDuration: 0,
      size: 'WINDOW',
      time: 0,
      videoWindowWidth: 0,
      videoWindowHeight: 0,
      played: 0,
      videoPlaybackWidth: 0,
      videoPlaybackHeight: 0,
      videoBitrate: 0,
      audioBitrate: 0,
      duration: 0,
      startupTime: 0,
      player: this.sample.player,
      //@ts-ignore
      analyticsVersion: __VERSION__,
    };
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
