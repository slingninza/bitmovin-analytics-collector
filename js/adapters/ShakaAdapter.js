/* global shaka */

import {HTML5Adapter} from './HTML5Adapter';
import {MIMETypes} from '../enums/MIMETypes';

export class ShakaAdapter extends HTML5Adapter {

  constructor(shakaPlayer, eventCallback, stateMachine) {
    super(shakaPlayer.getMediaElement(), eventCallback, stateMachine);

    if (!shaka) {
      throw new Error('`shaka` lib is not installed (must be loaded before analytics module)');
    }

    /**
     * @public
     * @member {shaka.Player}
     */
    this.shakaPlayer = shakaPlayer;
  }

  getPlayerVersion() {
    return shaka.Player.version;
  }

  isLive() {
    return this.shakaPlayer ? this.shakaPlayer.isLive() : false;
  }

  /**
   * @override
   */
  getMIMEType() {
    // FIXME: Could be HLS too, Shaka probably has a method to find out
    return MIMETypes.DASH;
  }

  /**
   * @override
   */
  getStreamURL() {
    return this.shakaPlayer ? this.shakaPlayer.getManifestUri() : null;
  }

  /**
   * Implemented by sub-class to deliver current quality-level info
   * specific to media-engine.
   * @override
   * @returns {QualityLevelInfo}
   */
  getCurrentQualityLevelInfo() {
    const variantTracks = this.shakaPlayer.getVariantTracks();

    const activeVideoTrack = variantTracks
      .filter((track) => track.active)
      .filter((track) => track.videoCodec || track.videoId !== undefined)[0];

    if (!activeVideoTrack) {
      // can only happen for audio-only streams
      return null;
    }

    const bitrate = activeVideoTrack.videoBandwidth || activeVideoTrack.bandwidth;
    const width = activeVideoTrack.width;
    const height = activeVideoTrack.height;

    return {
      bitrate,
      width,
      height
    };
  }
}
