/**
 * Created by lkroepfl on 12.01.17.
 */

import PlayerDetector from '../utils/PlayerDetector'
import BitmovinAnalyticsStateMachine from '../analyticsStateMachines/BitmovinAnalyticsStateMachine'
import Bitmovin7AnalyticsStateMachine from '../analyticsStateMachines/Bitmovin7AnalyticsStateMachine'
import VideoJsAnalyticsStateMachine from '../analyticsStateMachines/VideoJsAnalyticsStateMachine'
import HlsjsAnalyticsStateMachine from '../analyticsStateMachines/HlsjsAnalyticsStateMachine'

class AnalyticsStateMachineFactory {
  constructor() {
    this.playerDetector = new PlayerDetector;
  }

  getAnalyticsStateMachine(player, stateMachineCallbacks, opts = {}) {
    if (this.playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (this.playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7AnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (this.playerDetector.isVideoJs(player)) {
      return new VideoJsAnalyticsStateMachine(stateMachineCallbacks, opts);
    } else if (PlayerDetector.isHlsjs(player)) {
      return new HlsjsAnalyticsStateMachine(stateMachineCallbacks, opts);
    }
  };
}

export default AnalyticsStateMachineFactory
