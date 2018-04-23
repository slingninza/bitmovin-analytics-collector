/* global Hls */

import {HTML5Adapter} from './HTML5Adapter';
import {MIMETypes} from '../enums/MIMETypes';

/**
 * @class
 * @constructor
 */
export class HlsjsAdapter extends HTML5Adapter {

  /**
   * @constructs
   * @param {Hls} hls
   * @param {AnalyticsEventCallback} eventCallback
   * @param {AnalyticsStateMachine} stateMachine
   */
  constructor(hls, eventCallback, stateMachine) {

    // we don't have a mediaEl yet per se
    super(null, eventCallback, stateMachine);

    /**
     * @public
     * @member {Hls} hls Hls.js client instance
     */
    this.hls = hls;

    this.resetMedia();
    this.registerHlsEvents();
  }

  /**
   * Implemented by sub-class to deliver current quality-level info
   * specific to media-engine.
   * @override
   * @returns {QualityLevelInfo}
   */
  getCurrentQualityLevelInfo() {
    const hls = this.hls;
    const currentLevelObj = hls.levels[hls.currentLevel];
    if (!currentLevelObj) {
      return;
    }

    const attributes = currentLevelObj.attrs;
    const bitrate = parseInt(attributes.BANDWIDTH, 10);
    const width = parseInt(attributes.RESOLUTION.width, 10);
    const height = parseInt(attributes.RESOLUTION.height, 10);

    return {
      bitrate,
      width,
      height
    };
  }

  /**
   * @override
   */
  isLive() {
    const hls = this.hls;
    if (hls.currentLevel < 0) {
      return false;
    }
    const currentLevelObj = hls.levels[hls.currentLevel];
    if (!currentLevelObj) {
      return false;
    }
    return currentLevelObj.details.live;
  }

  /**
   * @override
   */
  getPlayerVersion() {
    return Hls.version;
  }

  /**
   * @override
   */
  getMIMEType() {
    return MIMETypes.HLS;
  }

  /**
   * @override
   */
  getStreamURL() {
    return this.hls.url;
  }

  registerHlsEvents() {
    const hls = this.hls;

    if (!Hls) {
      throw new Error('Hls.js is not defined installed (must be loaded before analytics module)');
    }

    hls.on(Hls.Events.MEDIA_ATTACHING, this.onMediaAttaching.bind(this));
    hls.on(Hls.Events.MEDIA_DETACHING, this.onMediaDetaching.bind(this));
    hls.on(Hls.Events.MANIFEST_LOADING, this.onManifestLoading.bind(this));

    // media is already attached, event has been triggered before
    // or we are in the event handler of this event itself.
    // we can not know how the stacktrace to this constructor will look like.
    // therefore we will guard from this case in
    // the onMediaAttaching method (avoid running it twice)
    if (hls.media) {
      this.onMediaAttaching();
    }

    if (hls.url) {
      this.onManifestLoading();
    }
  }

  onMediaAttaching() {
    // in case we are called again (when we are triggering this ourselves
    // but from the event handler of MEDIA_ATTACHING) we should not run again.
    if (this.mediaEl) {
      return;
    }

    this.mediaEl = this.hls.media;

    this.registerMediaElement();
    this.onMaybeReady();
  }

  onMediaDetaching() {
    this.unregisterMediaElement();
  }

  onManifestLoading() {
    this.onMaybeReady();
  }
}
