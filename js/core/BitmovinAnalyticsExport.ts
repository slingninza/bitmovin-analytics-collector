import {Analytics} from './Analytics';
import {Player} from '../enums/Player';
import {CdnProvider} from '../enums/CDNProvider';
import {AnalyticsStateMachineOptions} from '../types/AnalyticsStateMachineOptions';
import {AnalyicsConfig} from '../types/AnalyticsConfig';
import {VERSION} from '../Version';

export class AnalyticsPlayerModule {
  constructor(config: any, player: any) {
    const analyticsConfig = config.analytics;
    if (!analyticsConfig) {
      return;
    }

    const analytics = new Analytics(config as AnalyicsConfig, player);
    // assign the analytics object to the player
    player.analytics = analytics;
    this.wrapPlayerLoad(player, analytics);
  }

  wrapPlayerLoad(player: any, analytics: any) {
    const originalLoad = player.load;
    player.load = function () {
      if (arguments.length > 0) {
        const analyticsConfig = arguments[0].analytics;
        // we reset the analytics and reload with a new config
        analytics.sourceChange(analyticsConfig);
      }

      return originalLoad.apply(player, arguments);
    };
  };
}

export const AnalyticsModule = {
  name: 'analytics',
  module: {
    Analytics: AnalyticsPlayerModule,
  },
  hooks: {
    setup: (module: any, player: any) => {
      const analyticsModule = module.Analytics;
      const config = player.getConfig();

      new analyticsModule(config, player);
      return Promise.resolve();
    },
  },
};

//(analyticsWrapper as any).Players = Player;
//(analyticsWrapper as any).CdnProviders = CdnProvider;
//(analyticsWrapper as any).PlayerModule = AnalyticsModule;
//(analyticsWrapper as any).version = VERSION;
//
//(window as any).bitmovin = (window as any).bitmovin || {};
//(window as any).bitmovin.analytics = analyticsWrapper;
//
//export default analyticsWrapper;