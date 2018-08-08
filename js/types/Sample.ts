export interface Sample {
  domain?: any;
  path?: string;
  language?: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  isLive?: boolean;
  isCasting?: boolean;
  videoDuration?: number;
  size?: string;
  time?: number;
  videoWindowWidth?: number;
  videoWindowHeight?: number;
  droppedFrames?: number;
  played?: number;
  buffered?: number;
  paused?: number;
  ad?: number;
  seeked?: number;
  videoPlaybackWidth?: number;
  videoPlaybackHeight?: number;
  videoBitrate?: number;
  audioBitrate?: number;
  videoTimeStart?: number;
  videoTimeEnd?: number;
  videoStartupTime?: number;
  duration?: number;
  startupTime?: number;
  analyticsVersion?: any;
  playerStartupTime?: number;
  pageLoadType?: number;
  streamFormat?: string;
  isMuted?: boolean;
  progUrl?: string;
  m3u8Url?: string;
  mpdUrl?: string;
  playerTech?: string;
  version?: string;
  player?: any;
  state?: string;
  impressionId?: string;
  userId?: string;
  errorMessage?: any;
  errorCode?: any;
  autoplay?: any;
  pageLoadTime?: number;
  experimentName?: any;
  customData1?: any;
  customData2?: any;
  customData3?: any;
  customData4?: any;
  customData5?: any;
  key?: string;
  playerKey?: any;
  cdnProvider?: any;
  videoId?: string;
  customUserId?: string;
}
