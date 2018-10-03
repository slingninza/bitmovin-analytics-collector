import {post} from './Http';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';
import {Sample} from '../types/Sample';

export class AnalyticsCall {
  static analyticsServerUrl = ANALYTICS_BACKEND_BASE_URL + '/analytics';

  sendRequest(sample: Sample, callback: Function) {
    post(AnalyticsCall.analyticsServerUrl, sample, callback);
  }

  sendRequestSynchronous(sample: Sample, callback: Function) {
    post(AnalyticsCall.analyticsServerUrl, sample, callback, false);
  }

  getAnalyticsServerUrl() {
    return AnalyticsCall.analyticsServerUrl;
  }
}
