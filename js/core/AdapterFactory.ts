import PlayerDetector from '../utils/PlayerDetector';

import BitmovinAdapter from '../adapters/BitmovinAdapter';
import Bitmovin7Adapter from '../adapters/Bitmovin7Adapter';
import VideoJsAdapter from '../adapters/VideoJsAdapter';

import {HlsjsAdapter} from '../adapters/HlsjsAdapter';
import {ShakaAdapter} from '../adapters/ShakaAdapter';
import {DashjsAdapter} from '../adapters/DashjsAdapter';
import {Adapter} from '../types/Adapter';

/**
 * Stateless. Auto-maps given player instance to new adapter instances.
 * @class
 */
class AdapterFactory {
  /**
   * @param {object} player
   * @param {AnalyticsEventCallback} eventCallback
   * @param {AnalyticsStateMachine} stateMachine
   */
  static getAdapter(player: any, eventCallback: any, stateMachine: any): Adapter {
    let adapter;

    if (PlayerDetector.isBitmovinVersionPre7(player)) {
      adapter = new BitmovinAdapter(player, eventCallback);
    } else if (PlayerDetector.isBitmovinVersion7Plus(player)) {
      adapter = new Bitmovin7Adapter(player, eventCallback);
    } else if (PlayerDetector.isVideoJs(player)) {
      adapter = new VideoJsAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isHlsjs(player)) {
      adapter = new HlsjsAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isShaka(player)) {
      adapter = new ShakaAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isDashjs(player)) {
      adapter = new DashjsAdapter(player, eventCallback, stateMachine);
    }

    return <Adapter>adapter;
  }
}

export default AdapterFactory;
