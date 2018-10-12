import {DrmPerformanceInfo} from './DrmPerformanceInfo';
import {PlaybackInfo} from './PlaybackInfo';
import { AdAdapter } from './AdAdapter';

export interface Adapter {
  getPlayerName: () => string;
  drmPerformanceInfo: DrmPerformanceInfo;
  getPlayerVersion: () => string;
  getCurrentPlaybackInfo: () => PlaybackInfo;
  getAdAdapter?: () => AdAdapter;
}

