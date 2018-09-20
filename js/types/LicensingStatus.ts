import { AnalyticsLicensingStatus } from "../enums/AnalyticsLicensingStatus";

export interface LicensingStatus {
    status: AnalyticsLicensingStatus;
    allowedModules: Array<string>;
}