import { AnalyticsModule, AnalyticsPlayerModule } from '../../js/core/BitmovinAnalyticsExport'

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
                AnalyticsModule.hooks.setup(module, player)
                expect(player.getConfig).toHaveBeenCalled()
                expect(module.Analytics).toHaveBeenCalledTimes(1)
                expect(module.Analytics).toHaveBeenLastCalledWith(config, player)
            })

            test('instantiates analytics module with the obtained config', () => {
                const config = {};
                const player = {
                    getConfig: jest.fn(() => config)
                }
                const module = { Analytics: jest.fn() }

                AnalyticsModule.hooks.setup(module, player)

                expect(module.Analytics).toHaveBeenCalledTimes(1)
                expect(module.Analytics).toHaveBeenLastCalledWith(config, player)
            })
        })
    })
})