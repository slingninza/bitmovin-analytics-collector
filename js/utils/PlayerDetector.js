import Hls from 'hls.js';

/**
 * Stateless. Functions that detect players somehow.
 * @class
 */

class PlayerDetector {
  static isBitmovinVersionPre7 = function(player) {
    if (typeof player.getVersion === 'function') {
      return player.getVersion() < '7';
    }

    return false;
  };

  static isBitmovinVersion7Plus = function(player) {
    if (typeof player.version === 'string') {
      return player.version >= '7';
    }

    return false;
  };

  static isVideoJs = function(player) {
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

  static isShaka(player) {

    if (!shaka) {
      throw new Error('Hls.js is not defined installed (must be loaded before analytics module)');
    }

    return (
      typeof shaka.Player === 'function' && player.constructor === shaka.Player
    );

  }
}

export default PlayerDetector;
