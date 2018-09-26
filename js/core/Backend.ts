import {Sample} from '../types/Sample';
import {LicensingRequest, LicensingResponse, LicensingResult} from '../types/LicensingRequest';
import { LicenseCall } from '../utils/LicenseCall';
import {logger} from '../utils/Logger';
import { AnalyticsCall } from '../utils/AnalyticsCall';

const noOp = () => {};

export interface Backend {
  sendRequest(sample: Sample)
  sendUnloadRequest(sample: Sample)
  sendRequestSynchronous(sample: Sample)
}


class NoOpBackend implements Backend {
  constructor() {
  }
  sendRequest(sample: Sample) {}
  sendUnloadRequest(sample: Sample) {}
  sendRequestSynchronous(sample: Sample) {}
}

class QueueBackend implements Backend {
  queue: Sample[] = []
  unloadQueue: Sample[] = []
  syncQueue: Sample[] = []

  sendRequest(sample: Sample) {
    this.queue.push(sample)
  }
  sendUnloadRequest(sample: Sample) {
    this.unloadQueue.push(sample)
  }
  sendRequestSynchronous(sample: Sample) {
    this.syncQueue.push(sample)
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
  }
}

class RemoteBackend implements Backend {
  analyticsCall: AnalyticsCall

  constructor() {
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
}

export class LicenseCheckingBackend implements Backend {
  backend: Backend
  constructor(info: LicensingRequest) {
    this.backend = new QueueBackend();
    this.performLicenseCheck(info);
  }

  async performLicenseCheck(info: LicensingRequest) {
    try {
      const result = await LicenseCall(info.key, info.domain, info.version);
      if (result.status === LicensingResult.Granted) {
        const remoteBackend = new RemoteBackend();
        (this.backend as QueueBackend).flushTo(remoteBackend);
        this.backend = remoteBackend;
      } else {
        throw new Error("Licensing response unsuccessful: " + result.message);
      }
    } catch (e) {
      logger.log(e);
      this.backend = new NoOpBackend();
    }
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

}