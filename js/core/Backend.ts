import {Sample} from '../types/Sample';
import {LicensingRequest, LicensingResponse, LicensingResult} from '../types/LicensingRequest';
import { LicenseCall } from '../utils/LicenseCall';
import {logger} from '../utils/Logger';
import { AnalyticsCall } from '../utils/AnalyticsCall';
import { AdSample } from '../types/AdSample';

const noOp = () => {};

export interface Backend {
  sendRequest(sample: Sample)
  sendUnloadRequest(sample: Sample)
  sendRequestSynchronous(sample: Sample)
  sendAdRequest(sample: AdSample)
}


export class NoOpBackend implements Backend {
  sendRequest(sample: Sample) {}
  sendUnloadRequest(sample: Sample) {}
  sendRequestSynchronous(sample: Sample) {}
  sendAdRequest(sample: AdSample) {}
}

export class QueueBackend implements Backend {
  queue: Sample[] = []
  unloadQueue: Sample[] = []
  syncQueue: Sample[] = []
  adQueue: AdSample[] = []

  sendRequest(sample: Sample) {
    this.queue.push(sample)
  }
  sendUnloadRequest(sample: Sample) {
    this.unloadQueue.push(sample)
  }
  sendRequestSynchronous(sample: Sample) {
    this.syncQueue.push(sample)
  }
  sendAdRequest(sample: AdSample) {
    this.adQueue.push(sample)
  }

  flushTo(backend: Backend) {
    this.queue.forEach(e => {
      backend.sendRequest(e)
    })
    this.unloadQueue.forEach(e => {
      backend.sendUnloadRequest(e)
    })
    this.syncQueue.forEach(e => {
      backend.sendRequestSynchronous(e)
    })
    this.adQueue.forEach(e => {
      backend.sendAdRequest(e)
    })
  }
}

export class RemoteBackend implements Backend {
  analyticsCall: AnalyticsCall
  hasAdModule: boolean;

  constructor(hasAdModule: boolean) {
    this.hasAdModule = hasAdModule;
    this.analyticsCall = new AnalyticsCall();
  }

  sendRequest(sample: Sample) {
    this.analyticsCall.sendRequest(sample, noOp)
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
    this.analyticsCall.sendRequestSynchronous(sample, noOp);
  }

  sendAdRequest(sample: AdSample) {
    if(!this.hasAdModule) {
      return;
    }
    if (typeof navigator.sendBeacon === 'undefined') {
      this.analyticsCall.sendAdRequest(sample, noOp);
    } else {
      const success = navigator.sendBeacon(AnalyticsCall.adAnalayticsServerUrl, JSON.stringify(sample));
      if (!success) {
        this.analyticsCall.sendAdRequest(sample, noOp);
      }
    }
  }
}

export class LicenseCheckingBackend implements Backend {
  backend: Backend
  licenseCall: (key: string, domain: string, version: string) => Promise<LicensingResponse>
  promise: Promise<LicensingResponse>
  constructor(info: LicensingRequest, licenseCall: (key: string, domain: string, version: string) => Promise<LicensingResponse>) {
    this.backend = new QueueBackend();
    this.licenseCall = licenseCall;
    this.promise = this.performLicenseCheck(info.key, info.domain, info.version);
  }

  performLicenseCheck(key: string, domain: string, version: string): Promise<LicensingResponse> {
    return this.licenseCall(key, domain, version).then(result => {
      if (result.status === LicensingResult.Granted) {
        const remoteBackend = new RemoteBackend(true);
        (this.backend as QueueBackend).flushTo(remoteBackend);
        this.backend = remoteBackend;
      } else {
        throw new Error(result.message);
      }
      return result;
    }).catch(err => {
      logger.errorMessageTouser("License Check for Bitmovin Analytics failed because of ", err);
      this.backend = new NoOpBackend();
      return err;
    });
  }

  sendRequest(sample: Sample) {
    this.backend.sendRequest(sample);
  }
  sendUnloadRequest(sample: Sample) {
    this.backend.sendUnloadRequest(sample);
  }
  sendRequestSynchronous(sample: Sample) {
    this.backend.sendRequestSynchronous(sample);
  }
  sendAdRequest(sample: AdSample) {
    this.backend.sendAdRequest(sample);
  }
}
