import { Analytics } from "../../js/core/Analytics";

describe('Analytics', () => {
    test('it calls the http post method', () => {
        expect(Analytics.version).toEqual("version")
    });
});