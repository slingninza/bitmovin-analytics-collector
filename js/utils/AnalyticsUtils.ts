import { PageLoadType } from '../enums/PageLoadType';
import {logger} from '../utils/Logger';
import Utils from './Utils';
import { Analytics } from '../core/Analytics';
import { LicenseCall } from './LicenseCall';
import { AnalyticsLicensingStatus } from '../enums/AnalyticsLicensingStatus';

export const identifyPageLoadType = async (): Promise<PageLoadType> => {
  return new Promise<PageLoadType>(resolve => {
    window.setTimeout(() => {
      const hiddenProp = Utils.getHiddenProp();
      if (hiddenProp && document[hiddenProp] === true) {
        resolve(PageLoadType.BACKGROUND);
      } else {
        resolve(PageLoadType.FOREGROUND);
      }
    }, Analytics.PAGE_LOAD_TYPE_TIMEOUT);
  })
}


export const checkLicensing = async (key: any, domain: string, analyticsVersion, licenseCall: LicenseCall = new LicenseCall()): Promise<AnalyticsLicensingStatus> => {
  return new Promise<AnalyticsLicensingStatus>(resolve => {
    licenseCall.sendRequest(
      key,
      domain,
      analyticsVersion,
      (response) => resolve(handleLicensingResponse(response))
    );
  });
}

const handleLicensingResponse = (licensingResponse: any): AnalyticsLicensingStatus => {
  if (licensingResponse.status === 'granted') {
    return AnalyticsLicensingStatus.GRANTED;
  }
  if (licensingResponse.status === 'skip') {
    logger.log('Impression should not be sampled');
  } else {
    logger.log('Analytics license denied, reason: ' + licensingResponse.message);
  }
  return AnalyticsLicensingStatus.DENIED
}
