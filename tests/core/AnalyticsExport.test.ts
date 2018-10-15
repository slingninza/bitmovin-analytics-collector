import { version, Players, CdnProvider, PlayerModule } from '../../js/core/BitmovinAnalyticsExport'

test('exports Players', () => {
    expect(Players).toBeDefined;
})
test('exports CdnProviders', () => {
    expect(CdnProvider).toBeDefined;
})

test('exports PlayerModule', () => {
    expect(PlayerModule).toBeDefined;
})

test('exports version', () => {
    expect(version).toBeDefined;
})