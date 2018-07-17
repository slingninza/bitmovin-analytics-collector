import HttpCall from './HttpCall';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';

class AnalyticsCall extends HttpCall {
  static analyticsServerUrl = ANALYTICS_BACKEND_BASE_URL + '/analytics';

  sendRequest(sample: any, callback: Function) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback);
  }

  sendRequestSynchronous(sample: any, callback: Function) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback, false);
  }

  getAnalyticsServerUrl() {
    return AnalyticsCall.analyticsServerUrl;
  }
}

export default AnalyticsCall;
