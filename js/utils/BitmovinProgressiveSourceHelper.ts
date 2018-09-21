import { ProgressiveSourceConfig } from "../types/ProgressiveSourceConfig";
import { ProgressiveSourceInfo } from "../types/SourceInfo";

export const getSourceInfoFromBitmovinSourceConfig = (progressive: ProgressiveSourceConfig, player: any): ProgressiveSourceInfo => {
  if (!progressive) {
    return {
      progUrl: undefined,
      progBitrate: undefined,
    };
  }

  if (typeof progressive === 'string') {
    return {
      progUrl: progressive,
      progBitrate: 0,
    };
  }

  if (Array.isArray(progressive)) {
    const playbackVideoData = player.getPlaybackVideoData();
    const progressiveArrayIndex = parseInt(playbackVideoData.id) || 0;
    return {
      progUrl: progressive[progressiveArrayIndex].url,
      progBitrate: progressive[progressiveArrayIndex].bitrate || 0,
    };
  }

  if (typeof progressive === 'object') {
    return {
      progUrl: progressive.url,
      progBitrate: progressive.bitrate || 0,
    };
  }

  return {
    progUrl: undefined,
    progBitrate: undefined
  }
}
