/**
 * Created by lkroepfl on 12.01.17.
 */

import Hls from 'hls.js';

class PlayerDetector {
  isBitmovinVersionPre7 = function(player) {
    if (typeof player.getVersion === 'function') {
      return player.getVersion() < '7';
    }

    return false;
  };

  isBitmovinVersion7Plus = function(player) {
    if (typeof player.version === 'string') {
      return player.version >= '7';
    }

    return false;
  };

  isVideoJs = function(player) {
    if (typeof videojs === 'function') {
      if (videojs(player.id_) === player) {
        return true;
      }
    }
    return false;
  }

  static isHlsjs(player) {

    if (!Hls) {
      throw new Error('Hls.js is not defined installed (must be loaded before analytics module)');
    }

    return (
      typeof Hls === 'function' && player.constructor === Hls
    );
  }
}

export default PlayerDetector;
