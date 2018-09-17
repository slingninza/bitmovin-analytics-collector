import { Analytics } from "./Analytics";
import { AdSample } from "../types/AdSample";

interface AdCallbacks {
    onAdBreak: () => void;
}

export class AdAnalytics implements AdCallbacks {
    private analytics: Analytics;
    private adSample: AdSample;
    private callbacks;

    constructor(analytics: Analytics) {
        this.analytics = analytics;
        this.callbacks = {
            onAdBreak: (e) => {

            },
        }
    }

    onAdBreak() {
        
    }
//   sendAnalyticsRequestAndClearValues() {
//     this.sendAnalyticsRequest();
//     this.clearValues();
//   }

//   sendAnalyticsRequest() {
//     if (this.analytics.licensing === 'denied') {
//       return;
//     }

//     if (this.licensing === 'granted') {
//       this.sample.time = Utils.getCurrentTimestamp();

//       if (!this.isCastClient && !this.isCastReceiver) {
//         this.analyticsCall.sendRequest(this.sample, Utils.noOp);
//         return;
//       }

//       if (!this.isAllowedToSendSamples) {
//         const copySample = {...this.sample};
//         this.samplesQueue.push(copySample);
//       } else {
//         for (let i = 0; i < this.samplesQueue.length; i++) {
//           this.analyticsCall.sendRequest(this.samplesQueue[i], Utils.noOp);
//         }
//         this.samplesQueue = [];

//         this.analyticsCall.sendRequest(this.sample, Utils.noOp);
//       }
//     } else if (this.licensing === 'waiting') {
//       this.sample.time = Utils.getCurrentTimestamp();

//       logger.log('Licensing callback still pending, waiting...');

//       const copySample = {...this.sample};

//       window.setTimeout(() => {
//         this.analyticsCall.sendRequest(copySample, Utils.noOp);
//       }, Analytics.LICENSE_CALL_PENDING_TIMEOUT);
//     }
  }
}