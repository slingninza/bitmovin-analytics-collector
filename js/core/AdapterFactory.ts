import {PlayerDetector} from '../utils/PlayerDetector';
import {Bitmovin7Adapter} from '../adapters/Bitmovin7Adapter';
import Bitmovin8Adapter from '../adapters/Bitmovin8Adapter';
import {VideoJsAdapter} from '../adapters/VideoJsAdapter';
import {HlsjsAdapter} from '../adapters/HlsjsAdapter';
import {ShakaAdapter} from '../adapters/ShakaAdapter';
import {DashjsAdapter} from '../adapters/DashjsAdapter';
import {Adapter} from '../types/Adapter';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';
import { VideojsAnalyticsStateMachine } from '../analyticsStateMachines/VideoJsAnalyticsStateMachine';
import { HTML5AnalyticsStateMachine } from '../analyticsStateMachines/HTML5AnalyticsStateMachine';

/**
 * Stateless. Auto-maps given player instance to new adapter instances.
 * @class
 */
export class AdapterFactory {
  /**
   * @param {object} player
   * @param {AnalyticsEventCallback} eventCallback
   * @param {AnalyticsStateMachine} stateMachine
   */
  static getAdapter(player: any, eventCallback: any, stateMachine: AnalyticsStateMachine): Adapter {
    if (PlayerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7Adapter(player, eventCallback);
    } else if (PlayerDetector.isBitmovinVersion8Plus(player)) {
      return new Bitmovin8Adapter(player, eventCallback);
    } else if (PlayerDetector.isVideoJs(player)) {
      return new VideoJsAdapter(player, eventCallback, stateMachine as VideojsAnalyticsStateMachine);
    } else if (PlayerDetector.isHlsjs(player)) {
      return new HlsjsAdapter(player, eventCallback, stateMachine as HTML5AnalyticsStateMachine);
    } else if (PlayerDetector.isShaka(player)) {
      return new ShakaAdapter(player, eventCallback, stateMachine as HTML5AnalyticsStateMachine);
    } else if (PlayerDetector.isDashjs(player)) {
      return new DashjsAdapter(player, eventCallback, stateMachine as HTML5AnalyticsStateMachine);
    }
    throw new Error('Could not Detect Player !');
  }
}
