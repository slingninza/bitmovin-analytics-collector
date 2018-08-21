import {HTML5Adapter} from './HTML5Adapter';
import {MIMETypes} from '../enums/MIMETypes';
import {Player} from '../enums/Player';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';
import {QualityLevelInfo} from '../types/QualityLevelInfo';
import * as dashjs from 'dashjs';
import {AdapterEventCallback} from '../types/AdapterEventCallback';

export class DashjsAdapter extends HTML5Adapter {
  mediaPlayer!: dashjs.MediaPlayerClass;

  constructor(
    mediaPlayer: dashjs.MediaPlayerClass,
    eventCallback: AdapterEventCallback,
    stateMachine: AnalyticsStateMachine
  ) {
    super(null, eventCallback, stateMachine);

    let videoEl;
    let canPlay = false;
    try {
      videoEl = mediaPlayer.getVideoElement();
    } catch (e) {}
    if (!videoEl) {
      mediaPlayer.on(
        dashjs.MediaPlayer.events.CAN_PLAY,
        () => {
          if (canPlay) {
            return;
          }
          videoEl = mediaPlayer.getVideoElement();
          console.log('CAN_PLAY');
          canPlay = true;
          this._initialize(mediaPlayer, videoEl);
        },
        this
      );
    } else {
      this._initialize(mediaPlayer, videoEl);
    }
  }

  _initialize(mediaPlayer: any, videoEl: any) {
    this.mediaPlayer = mediaPlayer;
    this.setMediaElement(videoEl);
  }

  getPlayerName() {
    return Player.DASHJS;
  }

  getPlayerVersion() {
    return this.mediaPlayer.getVersion();
  }

  isLive() {
    // FIXME: Maybe use http://cdn.dashjs.org/latest/jsdoc/module-MediaPlayer.html#getLiveDelay__anchor
    return false;
  }
  /**
   * @override
   */
  getMIMEType() {
    return MIMETypes.DASH;
  }
  /**
   * @override
   */
  getStreamURL(): string | undefined {
    if (!this.mediaPlayer) {
      return;
    }

    const source = this.mediaPlayer.getSource();
    if (source) {
      return source.toString();
    }
  }
  /**
   * Implemented by sub-class to deliver current quality-level info
   * specific to media-engine.
   * @override
   * @returns {QualityLevelInfo}
   */
  getCurrentQualityLevelInfo(): QualityLevelInfo | null {
    if (this.mediaPlayer) {
      const videoBitrateInfoList = this.mediaPlayer.getBitrateInfoListFor('video');
      const currentVideoQualityIndex = this.mediaPlayer.getQualityFor('video');
      const currentVideoQuality = videoBitrateInfoList[currentVideoQualityIndex];
      const {width, height, bitrate} = currentVideoQuality;
      return {
        width,
        height,
        bitrate,
      };
    }
    return null;
  }
}
