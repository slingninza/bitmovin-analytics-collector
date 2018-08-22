export interface Adapter {
  getPlayerName: () => string;
  drmPerformanceInfo: DrmPerformanceInfo;
}

export interface DrmPerformanceInfo {
  drmUsed: boolean;
  drmInfo?: string;
  drmTime?: number;
}
