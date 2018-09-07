import {HTML5Adapter} from './HTML5Adapter';
import {MIMETypes} from '../enums/MIMETypes';
import {Player} from '../enums/Player';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';
import {QualityLevelInfo} from '../types/QualityLevelInfo';
import {AdapterEventCallback} from '../types/AdapterEventCallback';
import {DrmPerformanceInfo} from '../types/DrmPerformanceInfo';

export class ShakaAdapter extends HTML5Adapter {
  shakaPlayer: any;
  drmPerformanceInfo: DrmPerformanceInfo;
  constructor(shakaPlayer: any, eventCallback: AdapterEventCallback, stateMachine: AnalyticsStateMachine) {
    super(shakaPlayer.getMediaElement(), eventCallback, stateMachine);

    if (!(window as any).shaka) {
      throw new Error('`shaka` lib is not installed (must be loaded before analytics module)');
    }

    /**
     * @public
     * @member {shaka.Player}
     */
    this.shakaPlayer = shakaPlayer;

    this.drmPerformanceInfo = {drmUsed: false};
  }

  getPlayerName() {
    return Player.SHAKA;
  }

  getPlayerVersion() {
    return (window as any).shaka.Player.version;
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
  getCurrentQualityLevelInfo(): QualityLevelInfo | null {
    const variantTracks = this.shakaPlayer.getVariantTracks();

    const activeVideoTrack = variantTracks
      .filter((track: any) => track.active)
      .filter((track: any) => track.videoCodec || track.videoId !== undefined)[0];

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
      height,
    };
  }
}
