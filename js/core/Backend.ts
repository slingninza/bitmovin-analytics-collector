import {Sample} from '../types/Sample';
import {LicensingRequest, LicensingResponse} from '../types/LicensingRequest';
import { LicenseCall } from '../utils/LicenseCall';
import {logger} from '../utils/Logger';
import { AnalyticsCall } from '../utils/AnalyticsCall';

enum LicensingState {
  Waiting,
  Granted,
  Denied
}

const noOp = () => {};

export class Backend {
  licensingPromise: Promise<void>
  analyticsCall: AnalyticsCall

  constructor(licenseInfo: LicensingRequest) {
    this.analyticsCall = new AnalyticsCall();
    this.licensingPromise = this.checkLicensing(licenseInfo)
  }

  sendRequest(sample: Sample) {
    this.licensingPromise.then(() => {
      this.analyticsCall.sendRequest(sample, noOp)
    })
  }
  
  sendUnloadRequest(sample: Sample) {
    if (typeof navigator.sendBeacon === 'undefined') {
      this.sendRequestSynchronous(sample);
    } else {
      const success = navigator.sendBeacon(this.analyticsCall.getAnalyticsServerUrl(), JSON.stringify(sample));
      if (!success) {
        this.sendRequestSynchronous(sample);
      }
    }
  }

  sendRequestSynchronous(sample: Sample) {
    this.licensingPromise.then(() => {
      this.analyticsCall.sendRequestSynchronous(sample, noOp);
    })
  }

  private async checkLicensing(licenseInfo: LicensingRequest): Promise<void> {

    const response = await LicenseCall(licenseInfo.key, licenseInfo.domain, licenseInfo.version)
    if (response.status === 'granted') {
      return;
    } else if (response.status === 'skip') {
      logger.log('Impression should not be sampled');
      throw new Error(response.message);
    }
    logger.log('Analytics license denied, reason: ' + response.message);
    throw new Error(response.message);
  }
}
