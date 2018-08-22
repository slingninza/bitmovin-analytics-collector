export interface Adapter {
  getPlayerName: () => string;
  getDrmPerformance: () => DrmPerformanceInfo;
}

export interface DrmPerformanceInfo {
  drmUsed: boolean;
  drmInfo?: string;
  drmTime?: number;
}
