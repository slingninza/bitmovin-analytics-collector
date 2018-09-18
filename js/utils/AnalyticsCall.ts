import {HttpCall} from './HttpCall';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';
import {Sample} from '../types/Sample';
import { AdSample } from '../types/ads/AdSample';

export class AnalyticsCall extends HttpCall {
  static analyticsServerUrl = ANALYTICS_BACKEND_BASE_URL + '/analytics';
  static analyticsAdServerUrl = AnalyticsCall.analyticsServerUrl + '/a';

  sendRequest(sample: Sample, callback: Function) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback);
  }

  sendAdRequest(sample: AdSample, callback: Function) {
    this.post(AnalyticsCall.analyticsAdServerUrl, sample, callback);
  }

  sendRequestSynchronous(sample: Sample, callback: Function) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback, false);
  }

  getAnalyticsServerUrl() {
    return AnalyticsCall.analyticsServerUrl;
  }
}
