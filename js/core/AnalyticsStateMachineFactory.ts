import {PlayerDetector} from '../utils/PlayerDetector';
import {BitmovinAnalyticsStateMachine} from '../analyticsStateMachines/BitmovinAnalyticsStateMachine';
import {Bitmovin7AnalyticsStateMachine} from '../analyticsStateMachines/Bitmovin7AnalyticsStateMachine';
import {Bitmovin8AnalyticsStateMachine} from '../analyticsStateMachines/Bitmovin8AnalyticsStateMachine';
import {VideojsAnalyticsStateMachine} from '../analyticsStateMachines/VideoJsAnalyticsStateMachine';
import {HTML5AnalyticsStateMachine} from '../analyticsStateMachines/HTML5AnalyticsStateMachine';
import {AnalyticsStateMachineOptions} from '../types/AnalyticsStateMachineOptions';
import {StateMachineCallbacks} from '../types/StateMachineCallbacks';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';

/**
 * Stateless. Auto-maps given player instance to new state-machine instances.
 * @class
 */
export class AnalyticsStateMachineFactory {
  /**
   * @param {object} player
   * @param {AnalyticsStateMachineCallbacks} stateMachineCallbacks
   * @param {AnalyticsStateMachineOptions} opts
   */
  static getAnalyticsStateMachine(
    player: any,
    stateMachineCallbacks: StateMachineCallbacks,
    opts: AnalyticsStateMachineOptions
  ): AnalyticsStateMachine {
    if (PlayerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAnalyticsStateMachine(stateMachineCallbacks);
    } else if (PlayerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7AnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (PlayerDetector.isBitmovinVersion8Plus(player)) {
      return new Bitmovin8AnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (PlayerDetector.isVideoJs(player)) {
      return new VideojsAnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (PlayerDetector.isHlsjs(player) || PlayerDetector.isDashjs(player) || PlayerDetector.isShaka(player)) {
      return new HTML5AnalyticsStateMachine(stateMachineCallbacks, opts);
    } else {
      throw new Error('Could not detect player type');
    }
  }
}
