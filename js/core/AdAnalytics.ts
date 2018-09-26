import {Analytics} from './Analytics';
import { AdSample } from '../types/AdSample';
import { AnalyticsLicensingStatus } from '../enums/AnalyticsLicensingStatus';
import Utils from '../utils/Utils';
import { logger } from '../utils/Logger';

declare var __VERSION__: any;

export class AdAnalytics {
  static readonly MODULE_NAME = 'ads';

  private analytics: Analytics;
  private sample: AdSample = {};

  constructor(analytics: Analytics) {
    this.analytics = analytics;
  }

  sendAnalyticsRequestAndClearValues() {
    this.setAnalyticsSampleValues();
    this.sendAnalyticsRequest(this.sample);
    this.clearValues();
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
