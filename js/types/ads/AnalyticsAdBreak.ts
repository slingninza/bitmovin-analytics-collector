import { AdSample } from './AdSample';

export interface AnalyticsAdBreak {
  id: string;
  adStarted: number;
  adSample: Array<AdSample>
}
