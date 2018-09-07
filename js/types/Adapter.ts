import {DrmPerformanceInfo} from './DrmPerformanceInfo';

export interface Adapter {
  getPlayerName: () => string;
  drmPerformanceInfo: DrmPerformanceInfo;
}
