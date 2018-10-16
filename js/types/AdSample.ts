import {Sample} from './Sample';

export class AdSample {
  wrapperAdsCount?: number;
  adSkippable?: boolean;
  adClickthroughUrl?: string;
  adDescription?: string;
  adDuration?: number;
  adId?: string;
  adImpressionId?: string;
  adPlaybackHeight?: number;
  adPlaybackWidth?: number;
  adStartupTime?: number;
  adSystem?: string;
  adTitle?: string;
  advertiserName?: string;
  apiFramework?: string;
  audioBitrate?: number;
  clicked: number = 0;
  clickPosition?: number;
  closed: number = 0;
  closePosition?: number;
  completed: number = 0;
  creativeAdId?: string;
  creativeId?: string;
  dealId?: string;
  errorCode?: number;
  errorMessage?: string;
  isLinear?: boolean;
  mediaPath?: string;
  mediaServer?: string;
  mediaUrl?: string;
  midpoint: number = 0;
  minSuggestedDuration?: number;
  percentageInViewport?: number;
  quartile1: number = 0;
  quartile3: number = 0;
  skipped: number = 0;
  skipPosition?: number;
  started: number = 0;
  streamFormat?: string;
  surveyUrl?: string;
  time?: number;
  timeHovered?: number;
  timeInViewport?: number;
  timePlayed?: number;
  timeUntilHover?: number;
  universalAdIdRegistry?: string;
  universalAdIdValue?: string;
  videoBitrate?: number;
  adSkipAfter?: number;
  adPodPosition?: number;
  exitPosition?: number;
  playPercentage?: number;
  skipPercentage?: number;
  clickPercentage?: number;
  closePercentage?: number;
  errorPosition?: number;
  errorPercentage?: number;
  timeToContent?: number;
  timeFromContent?: number;
}

export class AdBreakSample {
  adPosition?: string;
  adOffset?: string;
  adScheduleTime?: number;
  adReplaceContentDuration?: number;
  adPreloadOffset?: number;
  adSkipAfter?: number;
  adTagPath?: string;
  adTagServer?: string;
  adTagType?: string;
  adTagUrl?: string;
  adIsPersistent?: boolean;
  adIdPlayer?: string;
  manifestDownloadTime?: number;
}

export class AdAnalyticsSample {
  adModule?: string;
  videoImpressionId?: string;
  userAgent?: string;
  language?: string;
  cdnProvider?: string;
  customData1?: string;
  customData2?: string;
  customData3?: string;
  customData4?: string;
  customData5?: string;
  customUserId?: string;
  domain?: string;
  experimentName?: string;
  key?: string;
  path?: string;
  player?: string;
  playerKey?: string;
  playerTech?: string;
  screenHeight?: number;
  screenWidth?: number;
  version?: string;
  size?: string;
  userId?: string;
  videoId?: string;
  videoTitle?: string;
  videoWindowHeight?: number;
  videoWindowWidth?: number;
  playerStartupTime?: number;
  analyticsVersion?: string;
  pageLoadTime?: number;
  pageLoadType?: number;
  autoplay?: boolean;
  
  constructor(sample?: Sample) {
    if(!sample) {
      return;
    }
    this.videoImpressionId = sample.impressionId;
    this.userAgent = sample.userAgent;
    this.language = sample.language;
    this.cdnProvider = sample.cdnProvider;
    this.customData1 = sample.customData1;
    this.customData2 = sample.customData2;
    this.customData3 = sample.customData3;
    this.customData4 = sample.customData4;
    this.customData5 = sample.customData5;
    this.customUserId = sample.customUserId;
    this.domain = sample.domain;
    this.experimentName = sample.experimentName;
    this.key = sample.key;
    this.path = sample.path;
    this.player = sample.player;
    this.playerKey = sample.playerKey;
    this.playerTech = sample.playerTech;
    this.screenHeight = sample.screenHeight;
    this.screenWidth = sample.screenWidth;
    this.version = sample.version;
    this.size = sample.size;
    this.userId = sample.userId;
    this.videoId = sample.videoId;
    this.videoTitle = sample.videoTitle;
    this.videoWindowHeight = sample.videoWindowHeight;
    this.videoWindowWidth = sample.videoWindowWidth;
  }
}
