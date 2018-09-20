import {StrategyType} from '../../enums/ads/StrategyType';
import {CreativeType} from '../../enums/ads/CreativeType';

export interface AdSample {
  adClickthroughUrl?: string;
  adCreativeType?: string;
  adDescription?: string;
  adDuration?: number;
  adFallbackLevel?: number;
  adId?: string;
  adIdPlayer?: string;
  adImpressionId?: string;
  adIsPersistent?: boolean;
  adModule?: string;
  adOffset?: string;
  adPlaybackHeight?: number;
  adPlaybackWidth?: number;
  adPosition?: string;
  adPreloadOffset?: number;
  adSkipAfter?: number;
  adSkippable?: boolean;
  adStartupTime?: number;
  adSystem?: string;
  adTagPath?: string;
  adTagServer?: string;
  adTagType?: string;
  adTagUrl?: string;
  adTitle?: string;
  advertiserName?: string;
  analyticsVersion?: string;
  apiFramework?: string;
  audioBitrate?: number;
  autoplay?: boolean;
  cdnProvider?: string;
  clicked?: number;
  clickPosition?: number;
  closed?: number;
  closePosition?: number;
  completed?: number;
  creativeAdId?: string;
  creativeDownloadTime?: number;
  creativeId?: string;
  creativeStartupTime?: number;
  customData1?: string;
  customData2?: string;
  customData3?: string;
  customData4?: string;
  customData5?: string;
  customUserId?: string;
  dealId?: string;
  domain?: string;
  errorCode?: number;
  errorMessage?: string;
  experimentName?: string;
  isLinear?: boolean;
  key?: string;
  language?: string;
  manifestDownloadTime?: number;
  mediaPath?: string;
  mediaServer?: string;
  mediaUrl?: string;
  midpoint?: number;
  minSuggestedDuration?: number;
  pageLoadTime?: number;
  pageLoadType?: number;
  path?: string;
  percentageInViewport?: number;
  player?: string;
  playerKey?: string;
  playerStartupTime?: number;
  playerTech?: string;
  quartile1?: number;
  quartile3?: number;
  screenHeight?: number;
  screenWidth?: number;
  sdkDownloadTime?: number;
  sdkInitTime?: number;
  size?: string;
  skipped?: number;
  skipPosition?: number;
  started?: number;
  streamFormat?: string;
  surveyUrl?: string;
  time?: number;
  timeHovered?: number;
  timeInViewport?: number;
  timePlayed?: number;
  timeUntilHover?: number;
  universalAdIdRegistry?: string;
  universalAdIdValue?: string;
  userAgent?: string;
  userId?: string;
  version?: string;
  videoBitrate?: number;
  videoId?: string;
  videoImpressionId?: string;
  videoTitle?: string;
  videoWindowHeight?: number;
  videoWindowWidth?: number;
}
