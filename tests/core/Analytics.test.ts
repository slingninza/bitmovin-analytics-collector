import { Analytics } from "../../js/core/Analytics";

describe('Analytics', () => {
    test('has a version property', () => {
        expect(Analytics.version).toBeDefined()
        expect(Analytics.version).toEqual("version")
    });
});