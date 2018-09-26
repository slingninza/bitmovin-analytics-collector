import {post} from './Http';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';

export class LicenseCall {
  static licenseServerUrl = ANALYTICS_BACKEND_BASE_URL + '/licensing';

  sendRequest(key: string, domain: string, version: string, callback: Function) {
    const licensingRequest = {
      key: key,
      domain: domain,
      analyticsVersion: version,
    };

    post(LicenseCall.licenseServerUrl, licensingRequest, callback);
  }
}
