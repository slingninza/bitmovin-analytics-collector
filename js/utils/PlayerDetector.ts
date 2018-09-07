export class PlayerDetector {
  static isBitmovinVersionPre7 = (player: any) => {
    if (PlayerDetector.isDashjs(player)) {
      return false;
    }

    if (typeof player.getVersion === 'function') {
      return player.getVersion() < '7';
    }

    return false;
  };

  static isBitmovinVersion7Plus = (player: any) => {
    const functionsToCheck = [
      'getAvailableLicenseServers',
      'getMaxTimeShift',
      'getAvailableSubtitles',
      'addEventHandler',
    ];
    for (const fun of functionsToCheck) {
      if (!(typeof player[fun] === 'function')) {
        return false;
      }
    }

    return true;
  };

  static isBitmovinVersion8Plus = (player: any) => {
    const functionsToCheck = ['on', 'off','destroy', 'getMaxTimeShift',];
    for (const fun of functionsToCheck) {
      if (!(typeof player[fun] === 'function')) {
        return false;
      }
    }

    return true;
  };

  static isVideoJs = (player: any) => {
    if (typeof (window as any).videojs === 'function') {
      if ((window as any).videojs(player.id_) === player) {
        return true;
      }
    }
    return false;
  };

  static isHlsjs(player: any) {
    if (!(window as any).Hls) {
      // Hls.js is not defined installed (must be loaded before analytics module)
      return false;
    }

    return typeof (window as any).Hls === 'function' && player.constructor === (window as any).Hls;
  }

  static isShaka(player: any) {
    if (!(window as any).shaka) {
      // Shaka is not defined installed (must be loaded before analytics module)
      return false;
    }

    return typeof (window as any).shaka.Player === 'function' && player.constructor === (window as any).shaka.Player;
  }

  static isDashjs(player: any) {
    return typeof player.addABRCustomRule === 'function';
  }
}
