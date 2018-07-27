import {PlayerDetector} from '../utils/PlayerDetector';

<<<<<<< HEAD:js/core/AdapterFactory.ts
import {BitmovinAdapter} from '../adapters/BitmovinAdapter';
import {Bitmovin7Adapter} from '../adapters/Bitmovin7Adapter';
import {VideoJsAdapter} from '../adapters/VideoJsAdapter';
=======
import BitmovinAdapter from '../adapters/BitmovinAdapter';
import Bitmovin8Adapter from '../adapters/Bitmovin8Adapter';
import VideoJsAdapter from '../adapters/VideoJsAdapter';
>>>>>>> Added Bitmovin8Adapter:js/core/AdapterFactory.js

import {HlsjsAdapter} from '../adapters/HlsjsAdapter';
import {ShakaAdapter} from '../adapters/ShakaAdapter';
import {DashjsAdapter} from '../adapters/DashjsAdapter';
import {Adapter} from '../types/Adapter';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';

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
  static getAdapter(player: any, eventCallback: any, stateMachine: AnalyticsStateMachine): Adapter | undefined {
    if (PlayerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAdapter(player, eventCallback);
    } else if (PlayerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin8Adapter(player, eventCallback);
    } else if (PlayerDetector.isVideoJs(player)) {
      return new VideoJsAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isHlsjs(player)) {
      return new HlsjsAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isShaka(player)) {
      return new ShakaAdapter(player, eventCallback, stateMachine);
    } else if (PlayerDetector.isDashjs(player)) {
      return new DashjsAdapter(player, eventCallback, stateMachine);
    }
  }
}
