import { AnalyticsModule, AnalyticsPlayerModule } from '../../js/core/BitmovinAnalyticsExport'
import { Analytics } from '../../js/core/Analytics'

describe('AnalyticsModule', () => {
    test('name', () => {
        expect(AnalyticsModule.name).toEqual("analytics");
    })
    test("module", () => {
        expect(AnalyticsModule.module).toMatchObject({
            Analytics: AnalyticsPlayerModule
        })
    })
    describe('hooks', () => {
        test('contains a hook named setup', () => {
            expect(AnalyticsModule.hooks.setup).toBeDefined()
        })
        describe('setup', () => {
            test('retrieves player config and calls new Analytics()', () => {
                const config = {};
                const player = {
                    getConfig: jest.fn(() => config)
                }
                const module = { Analytics: jest.fn() }
                return AnalyticsModule.hooks.setup(module, player).then(() => {
                    expect(player.getConfig).toHaveBeenCalled()
                    expect(module.Analytics).toHaveBeenCalledTimes(1)
                    expect(module.Analytics).toHaveBeenLastCalledWith(config, player)
                });
            })

            test('it tries to instantiate analytics if analytics config is not present', () => {
                const config = {};
                const player = {
                    getConfig: jest.fn(() => config)
                }
                const module = { Analytics: jest.fn() }
                return AnalyticsModule.hooks.setup(module, player).then(() => {
                    expect(module.Analytics).toHaveBeenCalled()
                });
            })

            test('return Promise resolves to return value of module', () => {
                const config = {};
                const player = {
                    getConfig: jest.fn(() => config)
                }
                const returnValue = { analytics: 'test' };
                const mod = { Analytics: jest.fn().mockImplementation(() => returnValue) }

                return expect(AnalyticsModule.hooks.setup(mod, player)).resolves.toStrictEqual(returnValue);
            })
        })
    })
})