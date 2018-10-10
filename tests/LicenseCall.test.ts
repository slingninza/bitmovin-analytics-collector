import {LicenseCall} from '../js/utils/LicenseCall';
import {ANALYTICS_BACKEND_BASE_URL} from '../js/utils/Settings';
import {post} from '../js/utils/Http';
import { LicensingResult } from '../js/types/LicensingRequest';

const granted = { status: LicensingResult.Granted, message: "there you go" };
jest.mock('../js/utils/Http', () => {
    return {
        post: jest.fn((url, body, callback, async) => {
            callback(granted);
        })
    }
})

describe('LicenseCall', () => {
    test('it calls the http post method', () => {
        LicenseCall('key', 'domain', 'version')
        expect(post).toHaveBeenCalled()
    });
    test('it calls the right licensing URL', () => {
        LicenseCall('key', 'domain', 'version')
        expect((post as any).mock.calls[0][0]).toBe(ANALYTICS_BACKEND_BASE_URL + '/licensing');
    })
    test('it passes the right payload to http.post', () => {
        LicenseCall('key', 'domain', 'version')
        const payload = (post as any).mock.calls[0][1];
        expect(payload.key).toBe('key');
        expect(payload.domain).toBe('domain');
        expect(payload.analyticsVersion).toBe('version');
    })
    test('passes through response as promise result', () => {
        return LicenseCall('key', 'domain', 'version').then((resp) => {
            expect(resp).toEqual(granted);
        })
    })
});