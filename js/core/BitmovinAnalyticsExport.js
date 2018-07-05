import Analytics from './Analytics';
import {Players} from '../enums/Players';
import CdnProviders from '../enums/CDNProviders';

const analyticsWrapper = (config) => {
  const analytics = new Analytics(config);
  return {
    register: (player, opts = {}) => { return analytics.register(player, opts); },
    getCurrentImpressionId: () => { return analytics.getCurrentImpressionId(); },
    setCustomData: analytics.setCustomData,
    setCustomDataOnce: analytics.setCustomDataOnce,
    sourceChange: (config) => { analytics.sourceChange(config); }
  };
};

analyticsWrapper._module = (config, player) => {
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

const wrapPlayerLoad = (player, analytics) => {
  const originalLoad = player.load;
  return function () {
    if (arguments.length > 0) {
      const analyticsConfig = arguments[0].analytics;
      // we reset the analytics and reload with a new config
      analytics.sourceChange(analyticsConfig);
    }

    return originalLoad.apply(player, arguments);
  };
};

analyticsWrapper.augment = (player) => {
  //decorate player to intercept setup
  const originalSetup = player.setup;

  player.setup = function () {
    const playerSetupPromise = originalSetup.apply(player, arguments);

    if (arguments.length === 0) {
      return playerSetupPromise;
    }
    const config = arguments[0];
    analyticsWrapper._module(config, player);

    return playerSetupPromise;
  };
};

const AnalyticsModule = {
  name: 'analytics',
  module: {
    Analytics: analyticsWrapper,
  },
  hooks: {
    setup: (module, player) => {
      const analytics = module.Analytics;
      const config = player.getConfig();

      analytics._module(config, player);
      return Promise.resolve();
    },
  }
};

analyticsWrapper.Players = Players;
analyticsWrapper.CdnProviders = CdnProviders;
analyticsWrapper.PlayerModule = AnalyticsModule;

window.bitmovin = window.bitmovin || {};
window.bitmovin.analytics = analyticsWrapper;

module.exports = analyticsWrapper;
