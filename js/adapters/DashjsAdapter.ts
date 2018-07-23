/* global dashjs */

import {HTML5Adapter} from './HTML5Adapter';
import {MIMETypes} from '../enums/MIMETypes';
import {Player} from '../enums/Player';
import {HTML5AnalyticsStateMachine} from '../analyticsStateMachines/HTML5AnalyticsStateMachine';

export class DashjsAdapter extends HTML5Adapter {
  /**
   * @public
   * @member {dashjs.MediaPlayer}
   */
  mediaPlayer: any;

  constructor(mediaPlayer: any, eventCallback: Function, stateMachine: HTML5AnalyticsStateMachine) {
    super(null, eventCallback, stateMachine);

    let videoEl = null;
    let canPlay = false;
    try {
      videoEl = mediaPlayer.getVideoElement();
    } catch (e) {
      /* eslint-disable-line no-empty */
    }
    if (!videoEl) {
      mediaPlayer.on(
        (window as any).dashjs.MediaPlayer.events.CAN_PLAY,
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
  getStreamURL() {
    return this.mediaPlayer ? this.mediaPlayer.getSource() : null;
  }
  /**
   * Implemented by sub-class to deliver current quality-level info
   * specific to media-engine.
   * @override
   * @returns {QualityLevelInfo}
   */
  getCurrentQualityLevelInfo() {
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
