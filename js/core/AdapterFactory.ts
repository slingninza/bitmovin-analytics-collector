import {PlayerDetector} from '../utils/PlayerDetector';
import {BitmovinAdapter} from '../adapters/BitmovinAdapter';
import {Bitmovin7Adapter} from '../adapters/Bitmovin7Adapter';
import Bitmovin8Adapter from '../adapters/Bitmovin8Adapter';
import {VideoJsAdapter} from '../adapters/VideoJsAdapter';
import {HlsjsAdapter} from '../adapters/HlsjsAdapter';
import {ShakaAdapter} from '../adapters/ShakaAdapter';
import {DashjsAdapter} from '../adapters/DashjsAdapter';
import {Adapter} from '../types/Adapter';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';
import { AdCallbacks } from '../types/AdCallbacks';

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
  static getAdapter(player: any, eventCallback: any, stateMachine: AnalyticsStateMachine, adCallbacks?: AdCallbacks): Adapter {
    if (PlayerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAdapter(player, eventCallback);
    } else if (PlayerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7Adapter(player, eventCallback);
    } else if (PlayerDetector.isBitmovinVersion8Plus(player)) {
      return new Bitmovin8Adapter(player, eventCallback, adCallbacks);
    } else if (PlayerDetector.isVideoJs(player)) {
      return new VideoJsAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isHlsjs(player)) {
      return new HlsjsAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isShaka(player)) {
      return new ShakaAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isDashjs(player)) {
      return new DashjsAdapter(player, eventCallback, stateMachine);
    }
    throw new Error('Could not Detect Player !');
  }
}
