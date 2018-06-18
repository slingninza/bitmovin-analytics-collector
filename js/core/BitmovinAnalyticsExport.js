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

analyticsWrapper.augment = (player) => {
  //decorate player to intercept setup
  const originalSetup = player.setup;
  let loadedAnalytics;
  player.setup = function () {
    const { analytics } = arguments[0];
    // TODO: Check that the config is actually present
    const retVal = originalSetup.apply(player, arguments);
    loadedAnalytics = analyticsWrapper(analytics);
    loadedAnalytics.register(player);
    // assign the analytics object to the player
    player.analytics = loadedAnalytics;
    return retVal;
  };

  const originalLoad = player.load;
  player.load = function () {
    const { analytics } = arguments[0];
    // we reset the analytics and reload with a new config
    loadedAnalytics.sourceChange(analytics);

    const retVal = originalLoad.apply(player, arguments);
    return retVal;
  };
};

analyticsWrapper.Players = Players;
analyticsWrapper.CdnProviders = CdnProviders;

window.bitmovin = window.bitmovin || {};
window.bitmovin.analytics = analyticsWrapper;

module.exports = analyticsWrapper;
