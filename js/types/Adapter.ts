import {DrmPerformanceInfo} from './DrmPerformanceInfo';
import {PlaybackInfo} from './PlaybackInfo';

export interface Adapter {
  getPlayerName: () => string;
  drmPerformanceInfo: DrmPerformanceInfo;
  getPlayerVersion: () => string;
  getCurrentPlaybackInfo: () => PlaybackInfo;
}

