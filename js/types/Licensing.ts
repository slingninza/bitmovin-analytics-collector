import { AnalyticsLicensingStatus } from "../enums/AnalyticsLicensingStatus";

export class Licensing {
    status: AnalyticsLicensingStatus = AnalyticsLicensingStatus.WAITING;
    allowedModules: Array<string> = [];

    isModuleAllowed = (module: string): boolean => {
        return this.allowedModules.indexOf(module) < 0;
    }
}