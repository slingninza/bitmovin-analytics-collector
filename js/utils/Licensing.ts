import {AnalyticsLicensingStatus} from '../enums/AnalyticsLicensingStatus';
import {LicenseCall} from './LicenseCall';
import {logger} from '../utils/Logger';

export class Licensing {
  private licenseCall: LicenseCall;
  private allowedModules: Array<string> = [];

  status: AnalyticsLicensingStatus = AnalyticsLicensingStatus.WAITING;

  constructor() {
    this.licenseCall = new LicenseCall();
  }

  isModuleAllowed = (module: string): boolean => {
    return this.allowedModules.indexOf(module) < 0;
  };

  checkLicensing(key: string | undefined, domain: string, analyticsVersion: string) {
    if (!key) {
      this.status = AnalyticsLicensingStatus.DENIED;
      return;
    }

    this.licenseCall.sendRequest(key, domain, analyticsVersion, this.handleLicensingResponse.bind(this));
  }

  handleLicensingResponse(licensingResponse: any) {
    if (licensingResponse.status === 'granted') {
      this.status = AnalyticsLicensingStatus.GRANTED;
    } else if (licensingResponse.status === 'skip') {
      this.status = AnalyticsLicensingStatus.DENIED;
      logger.log('Impression should not be sampled');
    } else {
      this.status = AnalyticsLicensingStatus.DENIED;
      logger.log('Analytics license denied, reason: ' + licensingResponse.message);
    }
  }
}
