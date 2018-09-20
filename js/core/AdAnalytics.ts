import { Analytics } from './Analytics';
import {logger} from '../utils/Logger';
import { AdSample } from '../types/ads/AdSample';
import { AdCallbacks } from '../types/ads/AdCallbacks';
import Utils from '../utils/Utils';
import { AdBreakEvent, AdClickedEvent, ErrorEvent, AdEvent, AdLinearityChangedEvent, AdQuartileEvent, AdQuartile, AdBreak } from 'bitmovin-player';
import { CreativeType } from '../enums/ads/CreativeType';
import { mapStringToStrategyType } from '../enums/ads/StrategyType';
import { AnalyticsCall } from '../utils/AnalyticsCall';
import { AnalyticsLicensingStatus } from '../enums/AnalyticsLicensingStatus';

declare var __VERSION__: any;

export class AdAnalytics implements AdCallbacks {
  private analytics: Analytics;
  private analyticsCall: AnalyticsCall;
  private licensing: AnalyticsLicensingStatus;
  private isAllowedToSendSamples: boolean;
  private currentAdBreak: AdBreak | null;
  private currentAdSample: AdSample | null;
  private adBreaks : Array<AdBreak>;
  private samples: Array<AdSample>;
  private samplesQueue: Array<AdSample>;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
    this.analyticsCall = new AnalyticsCall();
    this.licensing = AnalyticsLicensingStatus.WAITING;
    this.currentAdBreak = null;
    this.currentAdSample = {};
    this.adBreaks = [];
    this.samples = [];
    this.isAllowedToSendSamples = true;
    this.samplesQueue = [];
  }

  generateNewAdImpressionId() {
    return Utils.generateUUID();
  }

  getSample(adId: string): AdSample {
    let sample = this.samples.find(s => s.adId === adId);
    if (!sample) {
      sample = this.setupSample();
      this.samples.push(sample);
    }
    return sample;
  }

  onAdBreakStarted(event: AdBreakEvent) {
    this.currentAdBreak = event.adBreak;
  }
  onAdBreakFinished(event: AdBreakEvent) {
    this.currentAdBreak = null;
  }

  onAdStarted(event: AdEvent) {
    const adBreak: any = this.currentAdBreak;
    if (!adBreak) {
      return;
    }
    const ad = event.ad;
    const sample: AdSample = this.getSample(ad.id || '');
    sample.adIsPersistent = adBreak.persistent;
    sample.adPosition = adBreak.position;
    sample.adClickthroughUrl = ad.clickThroughUrl;
    sample.mediaUrl = ad.mediaFileUrl;
    sample.adDuration = ad.duration;
    sample.creativeAdId = ad.id;
    sample.started = 1;
    sample.isLinear = ad.isLinear;
    sample.adSkippable = true;
    if (ad.isLinear) {
      sample.adCreativeType = CreativeType.LINEAR;
    }
    if (this.currentAdBreak) {
      sample.adTagType = mapStringToStrategyType(this.currentAdBreak.tag.type);
    }
    this.currentAdSample = sample;
  }

  onAdFinished(event: AdEvent) {
    if (!this.currentAdSample) {
      return;
    }
    if (this.currentAdSample.skipped === 0 && !this.currentAdSample.errorCode) {
      this.currentAdSample.completed = 1;
    }
    this.sendAnalyticsRequestAndClearValues(this.currentAdSample);
  }


  onAdClicked(event: AdClickedEvent) {
    if (!this.currentAdSample) {
      return;
    }
    this.currentAdSample.clicked = 1,
    this.currentAdSample.clickPosition = event.timestamp

    this.sendAnalyticsRequestAndClearValues(this.currentAdSample);
  }

  onAdError(event: ErrorEvent) {
    if (!this.currentAdSample) {
      return;
    }
    this.currentAdSample.errorCode = event.code;
    this.sendAnalyticsRequestAndClearValues(this.currentAdSample);
  }

  onAdLinearityChanged(event: AdLinearityChangedEvent) {
    if (this.currentAdSample && event.isLinear) {
      this.currentAdSample.adCreativeType = CreativeType.LINEAR;
    }
    // TODO: set creative type for nonlinear/companion ads
  }

  onAdManifestLoaded(event: AdBreakEvent) {
    this.adBreaks.push(event.adBreak);
  }

  onAdQuartile(event: AdQuartileEvent) {
    if (!this.currentAdSample) {
      return;
    }
    if (event.quartile === AdQuartile.FIRST_QUARTILE) {
      this.currentAdSample.quartile1 = 1;
    } else if (event.quartile === AdQuartile.MIDPOINT) {
      this.currentAdSample.midpoint = 1;
    } else if (event.quartile === AdQuartile.THIRD_QUARTILE) {
      this.currentAdSample.quartile3 = 1
    }
  }

  onAdSkipped(event: AdEvent) {
    if (!this.currentAdSample) {
      return;
    }
    this.currentAdSample.skipped = 1;
    this.currentAdSample.skipPosition = this.currentAdSample.started ?  event.timestamp - this.currentAdSample.started : 0;
  }

  setupSample() {
    const sample: AdSample = {
      adImpressionId: this.generateNewAdImpressionId(),
      adSystem: '',
      advertiserName: '',
      analyticsVersion: __VERSION__,
      autoplay: false,
      clicked: 0,
      closed: 0,
      completed: 0,
      domain: Utils.sanitizePath(window.location.hostname),
      language: navigator.language || (navigator as any).userLanguage,
      midpoint: 0,
      pageLoadType: this.analytics.getPageLoadType(),
      path: Utils.sanitizePath(window.location.pathname),
      quartile1: 0,
      quartile3: 0,
      screenWidth: screen.width,
      screenHeight: screen.height,
      skipped: 0,
      started: 0,
      userAgent: navigator.userAgent
    };
    this.setVideoSampleData(sample);
    return sample;
  }

  setVideoSampleData(sample: AdSample) {
    const videoSample = this.analytics.getSample();
    // TODO: get videoPlaybackWidth/Height from AdEvents because it fails for preroll ads
    sample.adPlaybackHeight = videoSample.videoPlaybackHeight;
    sample.adPlaybackWidth = videoSample.videoPlaybackWidth;
    sample.cdnProvider = videoSample.cdnProvider;
    sample.key = videoSample.key;
    sample.language = videoSample.language;
    sample.pageLoadTime = videoSample.pageLoadTime;
    sample.pageLoadType = videoSample.pageLoadType;
    sample.player = videoSample.player;
    sample.playerKey = videoSample.key;
    sample.playerStartupTime = videoSample.playerStartupTime;
    sample.playerTech = videoSample.playerTech;
    sample.size = videoSample.size;
    sample.version = videoSample.version;
    sample.videoId = videoSample.videoId;
    sample.videoImpressionId = videoSample.impressionId;
    sample.videoWindowWidth = videoSample.videoWindowWidth;
    sample.videoWindowHeight = videoSample.videoWindowHeight;
    sample.userId = videoSample.userId;
    sample.videoBitrate = videoSample.videoBitrate;
  }

    sendAnalyticsRequestAndClearValues(sample: AdSample) {
      this.samples = this.samples.filter(s => s.adImpressionId !== sample.adImpressionId);
      this.sendAnalyticsRequest(sample);
    }

    sendAnalyticsRequest(sample: AdSample) {
      if (this.licensing === AnalyticsLicensingStatus.DENIED) {
        return;
      }

      if (this.licensing === AnalyticsLicensingStatus.GRANTED) {
        sample.time = Utils.getCurrentTimestamp();

        if (!this.analytics.getIsCastClient() && !this.analytics.getIsCastReceiver()) {
          this.analyticsCall.sendAdRequest(sample, Utils.noOp);
          return;
        }

        if (!this.isAllowedToSendSamples) {
          const copySample = {...sample};
          this.samplesQueue.push(copySample);
        } else {
          for (let i = 0; i < this.samplesQueue.length; i++) {
            this.analyticsCall.sendAdRequest(this.samplesQueue[i], Utils.noOp);
          }
          this.samplesQueue = [];

          this.analyticsCall.sendAdRequest(sample, Utils.noOp);
        }
      } else if (this.licensing === AnalyticsLicensingStatus.WAITING) {
        sample.time = Utils.getCurrentTimestamp();

        logger.log('Licensing callback still pending, waiting...');

        const copySample = {...sample};

        window.setTimeout(() => {
          this.analyticsCall.sendAdRequest(copySample, Utils.noOp);
        }, Analytics.LICENSE_CALL_PENDING_TIMEOUT);
      }
    }
}
