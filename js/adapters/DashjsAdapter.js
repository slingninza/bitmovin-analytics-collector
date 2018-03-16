/**
 * @author Stephan Hesse <tchakabam@gmail.com>
 */

/* global dashjs */

import {HTML5Adapter} from './HTML5Adapter';
import {MIMETypes} from '../enums/MIMETypes';

export class DashjsAdapter extends HTML5Adapter {

  constructor(mediaPlayer, eventCallback, stateMachine) {
    super(mediaPlayer.getVideoContainer(), eventCallback, stateMachine);

    if (!mediaPlayer) {
      throw new Error('`MediaPlayer` lib is not installed (must be loaded before analytics module)');
    }

    /**
     * @public
     * @member {dashjs.MediaPlayer}
     */
    this.mediaPlayer = mediaPlayer;
  }

  getPlayerVersion() {
    // FIXME: could not find anything for this Dash.js API
    return this.mediaPlayer.getVersion();
  }

  isLive() {
    // FIXME: could not find anything for this Dash.js API
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
    return null;
  }
}
