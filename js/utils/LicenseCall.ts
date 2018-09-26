import {post} from './Http';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';
import { LicensingResponse } from '../types/LicensingRequest';

const licenseServerUrl = ANALYTICS_BACKEND_BASE_URL + '/licensing';

export function LicenseCall (key: string, domain: string, version: string): Promise<LicensingResponse> {
  const licensingRequest = {
    key: key,
    domain: domain,
    analyticsVersion: version,
  };

  return new Promise<LicensingResponse>((resolve) => {
    post(licenseServerUrl, licensingRequest, (response) => {
      resolve(response);
    });
  });
}
