import {HttpCall} from './HttpCall';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';

export class LicenseCall extends HttpCall {
  static licenseServerUrl = ANALYTICS_BACKEND_BASE_URL + '/licensing';

  sendRequest(key: string, domain: string, version: string, callback: Function) {
    const licensingRequest = {
      key: key,
      domain: domain,
      analyticsVersion: version,
    };

    this.post(LicenseCall.licenseServerUrl, licensingRequest, callback);
  }
}
