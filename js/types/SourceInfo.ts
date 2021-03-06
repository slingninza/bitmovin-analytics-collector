export interface SourceInfo {
  videoId?: string;
  userId?: string;
  mpdUrl?: string;
  m3u8Url?: string;
  progUrl?: string;
  progBitrate?: number;
  title?: string;
}

export interface ProgressiveSourceInfo {
  progUrl? : string;
  progBitrate?: number;
}