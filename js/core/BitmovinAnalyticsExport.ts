import Analytics from './Analytics';
import {Players} from '../enums/Players';
import CdnProviders from '../enums/CDNProviders';
import AnalyticsStateMachineOptions from './AnalyticsStateMachineOptions';

const analyticsWrapper = (config: any) => {
  const analytics = new Analytics(config);
  return {
    register: (player: any, opts?: AnalyticsStateMachineOptions) => {
      return analytics.register(player, opts);
    },
    getCurrentImpressionId: () => {
      return analytics.getCurrentImpressionId();
    },
    setCustomData: analytics.setCustomData,
    setCustomDataOnce: analytics.setCustomDataOnce,
    sourceChange: (config: any) => {
      analytics.sourceChange(config);
    }
  };
};

(analyticsWrapper as any)._module = (config: any, player: any) => {
  const analyticsConfig = config.analytics;
  if (!analyticsConfig) {
    return;
  }

  const analytics = analyticsWrapper(analyticsConfig);
  analytics.register(player);
  // assign the analytics object to the player
  player.analytics = analytics;
  wrapPlayerLoad(player, analytics);
};

const wrapPlayerLoad = (player: any, analytics: any) => {
  const originalLoad = player.load;
  return function() {
    if (arguments.length > 0) {
      const analyticsConfig = arguments[0].analytics;
      // we reset the analytics and reload with a new config
      analytics.sourceChange(analyticsConfig);
    }

    return originalLoad.apply(player, arguments);
  };
};

(analyticsWrapper as any).augment = (player: any) => {
  //decorate player to intercept setup
  const originalSetup = player.setup;

  player.setup = function() {
    const playerSetupPromise = originalSetup.apply(player, arguments);

    if (arguments.length === 0) {
      return playerSetupPromise;
    }
    const config = arguments[0];
    (analyticsWrapper as any)._module(config, player);

    return playerSetupPromise;
  };
};

const AnalyticsModule = {
  name: 'analytics',
  module: {
    Analytics: analyticsWrapper
  },
  hooks: {
    setup: (module: any, player: any) => {
      const analytics = module.Analytics;
      const config = player.getConfig();

      analytics._module(config, player);
      return Promise.resolve();
    }
  }
};

(analyticsWrapper as any).Players = Players;
(analyticsWrapper as any).CdnProviders = CdnProviders;
(analyticsWrapper as any).PlayerModule = AnalyticsModule;

(window as any).bitmovin = (window as any).bitmovin || {};
(window as any).bitmovin.analytics = analyticsWrapper;

export default analyticsWrapper;
