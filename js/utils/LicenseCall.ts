import HttpCall from './HttpCall';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';

class LicenseCall extends HttpCall {
  static licenseServerUrl = ANALYTICS_BACKEND_BASE_URL + '/licensing';

  sendRequest(key: any, domain: any, version: any, callback: any) {
    const licensingRequest = {
      key: key,
      domain: domain,
      analyticsVersion: version
    };

    this.post(LicenseCall.licenseServerUrl, licensingRequest, callback);
  }
}

export default LicenseCall;
