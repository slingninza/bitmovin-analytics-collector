import {Backend, LicenseCheckingBackend} from '../js/core/Backend';
import {LicenseCall} from '../js/utils/LicenseCall';
import { LicensingResult } from '../js/types/LicensingRequest';

const granted = {
    status: 'granted',
    message: 'here you go'
}
const denied = {
    status: LicensingResult.Denied,
    message: 'here you go'
}
jest.mock('../js/utils/LicenseCall', () => {
    return {
        LicenseCall: jest.fn().mockResolvedValue(granted)
    }
});

test('constructor sends licensing request', () => {
    const backend = new LicenseCheckingBackend({
        domain: 'foo.com',
        key: '81354CDA-0EE6-4EDB-9A12-9EC7F80BBFE8',
        version: `1.2.3`
    })
    expect(LicenseCall).toHaveBeenCalledTimes(1);
})