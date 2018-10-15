import { LicenseCheckingBackend, RemoteBackend, QueueBackend, NoOpBackend } from '../js/core/Backend';
import { LicensingResult, LicensingResponse } from '../js/types/LicensingRequest';

import {logger} from '../js/utils/Logger';
jest.mock('../js/utils/Logger');

const granted : LicensingResponse = {
    status: LicensingResult.Granted,
    message: 'here you go'
}
const denied = {
    status: LicensingResult.Denied,
    message: 'You shall not pass!'
}

const validLicensingRequest = {
    domain: 'foo.com',
    key: '81354CDA-0EE6-4EDB-9A12-9EC7F80BBFE8',
    version: `1.2.3`
};

describe('LicenseCheckingBackend',  () => {
    describe('constructor', () => {
        test('calls LicenseCall', () => {
            const mockLicenseCall = jest.fn().mockResolvedValue(granted);
            const backend = new LicenseCheckingBackend(validLicensingRequest, mockLicenseCall);
            expect(mockLicenseCall).toHaveBeenCalledTimes(1);
            return backend.promise;
        });
        describe('successful response', () => {
            test('it queues requests until the LicenseCall resolves', () => {
                let trigger;
                const mockLicenseCall = (key: string, domain: string, version: string) => {
                    return new Promise<LicensingResponse>(resolve => {
                        trigger = resolve;
                    })
                };
                const backend = new LicenseCheckingBackend(validLicensingRequest, mockLicenseCall);
                expect(backend.backend).toBeInstanceOf(QueueBackend);
                trigger(granted);
                return backend.promise.then(result => {
                    expect(backend.backend).toBeInstanceOf(RemoteBackend);
                })
            });
            test('it calls flush on queue once license call is granted', () => {
                let trigger;
                const mockLicenseCall = (key: string, domain: string, version: string) => {
                    return new Promise<LicensingResponse>(resolve => {
                        trigger = resolve;
                    })
                };
                const backend = new LicenseCheckingBackend(validLicensingRequest, mockLicenseCall);
                expect(backend.backend).toBeInstanceOf(QueueBackend);
                const flushToMock = jest.fn();
                (backend.backend as QueueBackend).flushTo = flushToMock;
                trigger(granted);
                return backend.promise.then(result => {
                    expect(flushToMock).toHaveBeenCalledTimes(1);
                    expect(flushToMock).toHaveBeenCalledWith(expect.any(RemoteBackend));
                })
            });
        })
        describe('rejected response', () => {
            test('it assigns a noop backend', () => {
                const mockLicenseCall = jest.fn().mockResolvedValue(denied);
                const backend = new LicenseCheckingBackend(validLicensingRequest, mockLicenseCall);
                return backend.promise.catch(() => {
                    expect(backend.backend).toBeInstanceOf(NoOpBackend);
                })
            });
            test('it logs to the console', () => {
                const mockLicenseCall = jest.fn().mockResolvedValue(denied);
                const backend = new LicenseCheckingBackend(validLicensingRequest, mockLicenseCall);
                return backend.promise.catch(() => {
                    expect(logger.errorMessageTouser).toHaveBeenCalled();
                })
            })
        })


        //test('it queues requests until the LicenseCall resolves', () => {
        //    const mockLicenseCall = jest.fn().mockResolvedValue(granted);
        //    const backend = new LicenseCheckingBackend(validLicensingRequest, mockLicenseCall);
        //    expect(backend.backend).toBeInstanceOf(RemoteBackend);
        //});
    });
});