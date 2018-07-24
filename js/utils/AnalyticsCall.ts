import {HttpCall} from './HttpCall';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';
import {Sample} from '../types/Sample';

export class AnalyticsCall extends HttpCall {
  static analyticsServerUrl = ANALYTICS_BACKEND_BASE_URL + '/analytics';

  sendRequest(sample: Sample, callback: Function) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback);
  }

  sendRequestSynchronous(sample: Sample, callback: Function) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback, false);
  }

  getAnalyticsServerUrl() {
    return AnalyticsCall.analyticsServerUrl;
  }
}
