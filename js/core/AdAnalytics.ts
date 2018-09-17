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
    this.sample = {};
    this.manifestLoaded = false;
  }

  generateNewAdImpressionId() {
    this.sample.adImpressionId = Utils.generateUUID();
  }

  onAdBreakFinished(event: AdBreakEvent) {
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

  onAdFinished(event: AdEvent) {
    this.sample.completed = event.timestamp;
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

  onAdStarted(event: AdEvent) {
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
