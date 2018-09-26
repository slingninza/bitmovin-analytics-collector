export interface LicensingRequest {
  key: string;
  domain: string;
  version: string;
}

export enum LicensingResult {
  Granted = "granted",
  Denied = "denied",
  Skip = "skip"
}

export interface LicensingResponse {
  status: LicensingResult;
  message: string;
}
