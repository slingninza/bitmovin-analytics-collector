import Events from '../enums/Events';
import {getMIMETypeFromFileExtension} from '../enums/MIMETypes';
import {getStreamTypeFromMIMEType} from '../enums/StreamTypes';
import {Player} from '../enums/Player';
import {HTML5AnalyticsStateMachine} from '../analyticsStateMachines/HTML5AnalyticsStateMachine';

const BUFFERING_TIMECHANGED_TIMEOUT = 1000;

/**
 * @typedef QualityLevelInfo
 * @type {Object}
 * @prop {bitrate} number
 * @prop {width} number
 * @prop {height} number
 */

/**
 * Base-class for all HTML5 media based playback engines
 * @class
 * @constructor
 */
export class HTML5Adapter {
  /**
   * @constructs
   * @param {HTMLMediaElement} mediaElement
   * @param {function} eventCallback
   * @param {AnalyticsStateMachine} stateMachine
   */
  public eventCallback: (event: string, eventObject: any) => void;
  public stateMachine: HTML5AnalyticsStateMachine;
  public mediaEl: any;
  public mediaElEventHandlers: any;
  private analyticsBitrate_: number;
  private bufferingTimeout_: any;
  private isBuffering_: any;
  private isLive_: boolean;
  private isPaused_: boolean;
  private previousMediaTime_: any;
  private needsReadyEvent_: any;
  private needsFirstPlayIntent_: boolean;
  private mediaElementSet_: boolean;

  constructor(
    mediaElement: any,
    eventCallback: (event: string, eventObject: any) => void,
    stateMachine: HTML5AnalyticsStateMachine
  ) {
    this.eventCallback = eventCallback;

    this.stateMachine = stateMachine;

    this.mediaEl = mediaElement;

    this.mediaElEventHandlers = [];

    this.analyticsBitrate_ = -1;

    this.bufferingTimeout_ = null;

    this.isBuffering_ = false;

    this.isLive_ = false;

    this.isPaused_ = false;

    this.previousMediaTime_ = null;

    this.needsReadyEvent_ = true;

    this.needsFirstPlayIntent_ = true;

    this.mediaElementSet_ = false;

    if (mediaElement) {
      this.setMediaElement();
    }
  }

  getPlayerName() {
    return Player.HTML5;
  }

  /**
   * Used to setup against the media element.
   * We need this method to desynchronize construction of this class
   * and the actual initialization against the media element.
   * That is because at construction some media engine
   * may not already have the media element attached, for example
   * when passing in the DOM element is happening at once with passing the source URL
   * and can not be decoupled.
   * We are then awaiting an event from the engine and calling this with the media element
   * as argument from our sub-class.
   *
   * This method can also be called without arguments and then it will perform
   * initialization against the existing media element (should only be called once, will throw an error otherwise)
   *
   * It can also be used to replace the element.
   *
   *
   
   */
  setMediaElement(mediaElement = null) {
    // replace previously existing, if calld with args
    if (mediaElement && this.mediaEl) {
      this.unregisterMediaElement();
      this.mediaElementSet_ = false;
    }

    // if called without args we assume it's already there
    // we can also be called with args but without any being there before
    if (mediaElement) {
      this.mediaEl = mediaElement;
    }

    if (!this.mediaEl) {
      throw new Error('No media element owned');
    }

    if (this.mediaElementSet_) {
      throw new Error('Media element already set (only call this once)');
    }
    this.mediaElementSet_ = true;

    this.registerMediaElement();
    this.onMaybeReady();
  }

  /** Implemented by sub-class to deliver current quality-level info
   * specific to media-engine.
   * @returns {QualityLevelInfo}
   * @abstract
   */
  getCurrentQualityLevelInfo(): any {
    return null;
  }

  /**
   * @abstract
   */
  isLive(): boolean {
    return false;
  }

  /**	+
   * Can be overriden by sub-classes
   * @returns {string}
   *
   */
  getMIMEType(): any {
    const mediaEl = this.mediaEl;
    if (!mediaEl) {
      return;
    }

    return getMIMETypeFromFileExtension(mediaEl.src);
  }

  /**
   * Can be overriden by sub-classes
   * @returns {string}
   */
  getStreamType(): any {
    return getStreamTypeFromMIMEType(this.getMIMEType());
  }

  /**
   * @abstract
   * @returns {string}
   */
  getPlayerVersion(): any {
    return null;
  }

  /**
   * Can be overriden by subclasses.
   * @returns {string}
   */
  getStreamURL() {
    const mediaEl = this.mediaEl;
    if (!mediaEl) {
      return null;
    }

    return mediaEl.src;
  }

  resetMedia() {
    this.mediaEl = null;
    this.mediaElEventHandlers = [];
  }

  registerMediaElement() {
    const mediaEl = this.mediaEl;
    if (!mediaEl) {
      return;
    }

    this.listenToMediaElementEvent('loadedmetadata', () => {
      // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
      // HAVE_NOTHING 0 No information is available about the media resource.
      // HAVE_METADATA 1 Enough of the media resource has been retrieved that
      // the metadata attributes are initialized. Seeking will no longer raise an exception.
      // HAVE_CURRENT_DATA 2 Data is available for the current playback position,
      // but not enough to actually play more than one frame.
      // HAVE_FUTURE_DATA  3 Data for the current playback position as well as for
      //  at least a little bit of time into the future is available
      // (in other words, at least two frames of video, for example).
      // HAVE_ENOUGH_DATA  4 Enough data is available—and the download rate is high
      // enough—that the media can be played through to the end without interruption.
      if (mediaEl.readyState !== 1) {
        // we can't really gather any more information at this point
        return;
      }

      // silent
      this.checkQualityLevelAttributes(true);

      const {duration, autoplay, width, height, videoWidth, videoHeight, muted} = mediaEl;

      // This is redundant with what we give to updateMetadata method.
      // Not sure if there are good reasons to keep that so or if we should better centralize.
      const info = {
        type: 'html5',
        isLive: this.isLive(),
        version: this.getPlayerVersion(),
        streamType: this.getStreamType(),
        streamUrl: this.getStreamURL(),
        duration,
        autoplay,
        // HTMLVideoElement.width and HTMLVideoElement.height
        // is a DOMString that reflects the height HTML attribute,
        // which specifies the height of the display area, in CSS pixels.
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        // Returns an unsigned long containing the intrinsic
        // height of the resource in CSS pixels,
        // taking into account the dimensions, aspect ratio,
        // clean aperture, resolution, and so forth,
        // as defined for the format used by the resource.
        // If the element's ready state is HAVE_NOTHING, the value is 0.
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
        videoWindowWidth: videoWidth,
        videoWindowHeight: videoHeight,
        muted,
      };

      // silence events if we have not yet intended play
      if (this.needsFirstPlayIntent_) {
        return;
      }

      this.eventCallback(Events.METADATA_LOADED, info);
    });

    // We need the PLAY event to indicate the intent to play
    // NOTE: use TIMECHANGED event on 'playing' and trigger PLAY as intended in states.dot graph

    this.listenToMediaElementEvent('play', () => {
      const {currentTime} = mediaEl;

      this.needsFirstPlayIntent_ = false;

      this.eventCallback(Events.PLAY, {
        currentTime,
      });
    });

    this.listenToMediaElementEvent('pause', () => {
      this.onPaused();
    });

    this.listenToMediaElementEvent('playing', () => {
      const {currentTime} = mediaEl;

      this.isPaused_ = false;

      // silence events if we have not yet intended play
      if (this.needsFirstPlayIntent_) {
        return;
      }

      this.eventCallback(Events.TIMECHANGED, {
        currentTime,
      });
    });

    this.listenToMediaElementEvent('error', () => {
      const {currentTime, error} = mediaEl;

      this.eventCallback(Events.ERROR, {
        currentTime,
        // See https://developer.mozilla.org/en-US/docs/Web/API/MediaError
        code: error.code,
        message: error.message,
      });
    });

    this.listenToMediaElementEvent('volumechange', () => {
      const {muted, currentTime} = mediaEl;

      if (muted) {
        this.eventCallback(Events.MUTE, {
          currentTime,
        });
      } else {
        this.eventCallback(Events.UN_MUTE, {
          currentTime,
        });
      }
    });

    this.listenToMediaElementEvent('seeking', () => {
      const {currentTime} = mediaEl;

      this.eventCallback(Events.SEEK, {
        currentTime,
        droppedFrames: 0,
      });
    });

    this.listenToMediaElementEvent('seeked', () => {
      const {currentTime} = mediaEl;

      if (this.bufferingTimeout_) {
        clearTimeout(this.bufferingTimeout_);
      }

      this.eventCallback(Events.SEEKED, {
        currentTime,
        droppedFrames: 0,
      });
    });

    this.listenToMediaElementEvent('timeupdate', () => {
      const {currentTime} = mediaEl;

      this.isBuffering_ = false;

      // silence events if we have not yet intended play
      if (this.needsFirstPlayIntent_) {
        return;
      }

      if (!this.isPaused_) {
        this.eventCallback(Events.TIMECHANGED, {
          currentTime,
        });
      }

      this.checkQualityLevelAttributes();

      // We are doing this in case we can not rely
      // on the "stalled" or "waiting" events in a specific browser
      // and to detect intrinsinc paused states (when we do not get a paused event)
      // but the player is paused already before attach or is paused from initialization on.
      this.checkPlayheadProgress();

      this.previousMediaTime_ = currentTime;
    });

    // The stalled event is fired when the user agent is trying to fetch media data,
    // but data is unexpectedly not forthcoming.
    // https://developer.mozilla.org/en-US/docs/Web/Events/stalled
    this.listenToMediaElementEvent('stalled', () => {
      // this event doesn't indicate buffering by definition (interupted playback),
      // only that data throughput to playout buffers is not as high as expected
      // It happens on Chrome every once in a while as SourceBuffer's are not fed
      // as fast as the underlying native player may prefer (but it does not lead to
      // interuption).
    });

    // The waiting event is fired when playback has stopped because of a temporary lack of data.
    // See https://developer.mozilla.org/en-US/docs/Web/Events/waiting
    this.listenToMediaElementEvent('waiting', () => {
      this.onBuffering();
    });
  }

  /**
   * Should only be calld when a mediaEl is attached
   */
  listenToMediaElementEvent(event: any, handler: any) {
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }

    const boundHandler = handler.bind(this);

    this.mediaElEventHandlers.push(boundHandler);
    this.mediaEl.addEventListener(event, boundHandler, false);
  }

  onMaybeReady() {
    if (!this.needsReadyEvent_ || !this.mediaEl) {
      return;
    }

    this.needsReadyEvent_ = false;

    const {duration, autoplay, width, height, videoWidth, videoHeight, muted} = this.mediaEl;

    const info = {
      type: 'html5',
      isLive: this.isLive(),
      version: this.getPlayerVersion(),
      streamType: this.getStreamType(),
      streamUrl: this.getStreamURL(),
      duration: duration,
      autoplay: autoplay,
      // HTMLVideoElement.width and HTMLVideoElement.height
      // is a DOMString that reflects the height HTML attribute,
      // which specifies the height of the display area, in CSS pixels.
      // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
      width: parseInt(width),
      height: parseInt(height),
      // Returns an unsigned long containing the intrinsic
      // height of the resource in CSS pixels,
      // taking into account the dimensions, aspect ratio,
      // clean aperture, resolution, and so forth,
      // as defined for the format used by the resource.
      // If the element's ready state is HAVE_NOTHING, the value is 0.
      // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
      videoWindowWidth: videoWidth,
      videoWindowHeight: videoHeight,
      muted,
    };

    this.stateMachine.updateMetadata(info);

    this.eventCallback(Events.READY, info);
  }

  /**
   * Should only be calld when a mediaEl is attached
   */
  unregisterMediaElement() {
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }

    this.mediaElEventHandlers.forEach((handler: any) => {
      this.mediaEl.removeEventListener(handler);
    });

    this.resetMedia();
  }

  onBuffering() {
    const {currentTime} = this.mediaEl;

    // this handler may be called multiple times
    // for one actual buffering-event occuring so lets guard from
    // triggering this event redundantly.
    if (this.isBuffering_ || this.isPaused_) {
      return;
    }

    this.eventCallback(Events.START_BUFFERING, {
      currentTime,
    });

    this.isBuffering_ = true;
  }

  onPaused() {
    if (this.isPaused_) {
      return;
    }

    const {currentTime} = this.mediaEl;

    this.eventCallback(Events.PAUSE, {
      currentTime,
    });

    this.isPaused_ = true;
  }

  checkPlayheadProgress() {
    const mediaEl = this.mediaEl;

    if (mediaEl.paused) {
      this.onPaused();
    }

    if (this.bufferingTimeout_) {
      clearTimeout(this.bufferingTimeout_);
    }

    this.bufferingTimeout_ = window.setTimeout(() => {
      if (mediaEl.paused || (mediaEl.ended && !this.isBuffering_)) {
        return;
      }

      const timeDelta = mediaEl.currentTime - this.previousMediaTime_;

      if (timeDelta < BUFFERING_TIMECHANGED_TIMEOUT) {
        this.onBuffering();
      }
    }, BUFFERING_TIMECHANGED_TIMEOUT);
  }

  /**
   * @param {boolean} silent
   */
  checkQualityLevelAttributes(silent = false) {
    const mediaEl = this.mediaEl;

    const qualityLevelInfo = this.getCurrentQualityLevelInfo();
    if (!qualityLevelInfo) {
      return;
    }

    const {bitrate, width, height} = qualityLevelInfo;

    const isLive = this.isLive();

    if (isLive !== this.isLive_) {
      this.isLive_ = isLive;

      if (!silent) {
        this.stateMachine.updateMetadata({
          isLive,
        });
      }
    }

    if (this.analyticsBitrate_ !== bitrate) {
      const eventData = {
        width,
        height,
        bitrate,
        currentTime: mediaEl.currentTime,
      };

      if (!silent) {
        this.eventCallback(Events.VIDEO_CHANGE, eventData);
      }

      this.analyticsBitrate_ = bitrate;
    }
  }
}
