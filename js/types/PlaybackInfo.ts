export interface PlaybackInfo {
  isLive?: boolean;
  version: string;
  playerTech?: string;
  videoDuration?: number;
  streamFormat?: string;
  progUrl?: string;
  m3u8Url?: string;
  mpdUrl?: string;
  videoWindowWidth?: number;
  videoWindowHeight?: number;
  isMuted?: boolean;
  autoplay?: boolean;
  videoTitle?: string;
  videoBitrate?: number;
  audioBitrate?: number;
  progBitrate?: number;
}
