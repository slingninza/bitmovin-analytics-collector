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

    const analytics = new Analytics(analyticsConfig as AnalyicsConfig, player);
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

      const analyticsInstance = new analyticsModule(config, player);
      return Promise.resolve(analyticsInstance);
    },
  },
};

export { Player as Players };
export { CdnProvider as CdnProvider };
export { AnalyticsModule as PlayerModule };
export { VERSION as version };


(window as any).bitmovin = (window as any).bitmovin || {};
(window as any).bitmovin.analytics = (window as any).bitmovin.analytics  || {};
(window as any).bitmovin.analytics.PlayerModule = AnalyticsModule;

//
//export default analyticsWrapper;