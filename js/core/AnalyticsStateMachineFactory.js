import PlayerDetector from '../utils/PlayerDetector';
import {BitmovinAnalyticsStateMachine} from '../analyticsStateMachines/BitmovinAnalyticsStateMachine';
import {Bitmovin7AnalyticsStateMachine} from '../analyticsStateMachines/Bitmovin7AnalyticsStateMachine';
import {VideoJsAnalyticsStateMachine} from '../analyticsStateMachines/VideoJsAnalyticsStateMachine';
// import HlsjsAnalyticsStateMachine from '../analyticsStateMachines/HlsjsAnalyticsStateMachine';
// import ShakaAnalyticsStateMachine from '../analyticsStateMachines/ShakaAnalyticsStateMachine'
import {HTML5AnalyticsStateMachine} from '../analyticsStateMachines/HTML5AnalyticsStateMachine';

/**
 * Stateless. Auto-maps given player instance to new state-machine instances.
 * @class
 */
class AnalyticsStateMachineFactory {
  /**
   * @param {object} player
   * @param {AnalyticsStateMachineCallbacks} stateMachineCallbacks
   * @param {AnalyticsStateMachineOptions} opts
   */
  static getAnalyticsStateMachine(player, stateMachineCallbacks, opts = {}) {
    if (PlayerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (PlayerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7AnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (PlayerDetector.isVideoJs(player)) {
      return new VideoJsAnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (
      PlayerDetector.isHlsjs(player) ||
      PlayerDetector.isShaka(player)) {
      return new HTML5AnalyticsStateMachine(stateMachineCallbacks, opts);
    } else {
      throw new Error('Could not detect player type');
    }
  }
}

export default AnalyticsStateMachineFactory;
