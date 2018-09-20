import {Event} from '../enums/Event';
import {getMIMETypeFromFileExtension} from '../enums/MIMETypes';
import {getStreamTypeFromMIMEType} from '../enums/StreamTypes';
import {Player} from '../enums/Player';
import {Adapter} from '../types/Adapter';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';
import {QualityLevelInfo} from '../types/QualityLevelInfo';
import {AdapterEventCallback} from '../types/AdapterEventCallback';
import {DrmPerformanceInfo} from '../types/DrmPerformanceInfo';
import {PlaybackInfo} from '../types/PlaybackInfo';

const BUFFERING_TIMECHANGED_TIMEOUT = 1000;

/**
 * Base-class for all HTML5 media based playback engines
 * @class
 * @constructor
 */

export abstract class HTML5Adapter implements Adapter {
  public eventCallback: AdapterEventCallback;
  public stateMachine: AnalyticsStateMachine;
  public mediaEl: HTMLVideoElement | null;
  public mediaElEventHandlers: {event: string; handler: any}[];
  private analyticsBitrate_: number;
  private bufferingTimeout_: number | null;
  private isBuffering_: boolean;
  private isLive_: boolean;
  private isPaused_: boolean;
  private previousMediaTime_: number;
  private needsReadyEvent_: boolean;
  private needsFirstPlayIntent_: boolean;
  private mediaElementSet_: boolean;
  drmPerformanceInfo: DrmPerformanceInfo;

  constructor(
    mediaElement: HTMLVideoElement | null,
    eventCallback: AdapterEventCallback,
    stateMachine: AnalyticsStateMachine
  ) {
    this.eventCallback = eventCallback;

    this.drmPerformanceInfo = {drmUsed: false};

    this.stateMachine = stateMachine;

    this.mediaEl = mediaElement;

    this.mediaElEventHandlers = [];

    this.analyticsBitrate_ = -1;

    this.bufferingTimeout_ = null;

    this.isBuffering_ = false;

    this.isLive_ = false;

    this.isPaused_ = false;

    this.previousMediaTime_ = 0;

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

  getCurrentPlaybackInfo(): PlaybackInfo {
    const {duration, autoplay, width, height, videoWidth, videoHeight, muted} = (this.mediaEl as any);
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
      width: width,
      height: height,
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
    return info;
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
  setMediaElement(mediaElement: HTMLVideoElement | null = null) {
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

  abstract getCurrentQualityLevelInfo(): QualityLevelInfo | null;

  abstract isLive(): boolean;

  /**
   * Can be overriden by sub-classes
   * @returns {string}
   *
   */
  getMIMEType(): string | undefined {
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
  getStreamType(): string | undefined {
    let mimetype = this.getMIMEType();
    if (mimetype) {
      return getStreamTypeFromMIMEType(mimetype);
    }
  }

  abstract getPlayerVersion(): string;

  /**
   * Can be overriden by subclasses.
   * @returns {string}
   */
  getStreamURL(): string | undefined {
    const mediaEl = this.mediaEl;
    if (!mediaEl) {
      return;
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
        width: width,
        height: height,
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

      this.eventCallback(Event.METADATA_LOADED, info);
    });

    // We need the PLAY event to indicate the intent to play
    // NOTE: use TIMECHANGED event on 'playing' and trigger PLAY as intended in states.dot graph

    this.listenToMediaElementEvent('play', () => {
      const {currentTime} = mediaEl;

      this.needsFirstPlayIntent_ = false;

      this.eventCallback(Event.PLAY, {
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

      this.eventCallback(Event.TIMECHANGED, {
        currentTime,
      });
    });

    this.listenToMediaElementEvent('error', () => {
      const {currentTime, error} = mediaEl;

      this.eventCallback(Event.ERROR, {
        currentTime,
        // See https://developer.mozilla.org/en-US/docs/Web/API/MediaError
        code: error ? error.code : null,
        message: error ? error.message : null,
      });
    });

    this.listenToMediaElementEvent('volumechange', () => {
      const {muted, currentTime} = mediaEl;

      if (muted) {
        this.eventCallback(Event.MUTE, {
          currentTime,
        });
      } else {
        this.eventCallback(Event.UN_MUTE, {
          currentTime,
        });
      }
    });

    this.listenToMediaElementEvent('seeking', () => {
      const {currentTime} = mediaEl;

      this.eventCallback(Event.SEEK, {
        currentTime,
        droppedFrames: 0,
      });
    });

    this.listenToMediaElementEvent('seeked', () => {
      const {currentTime} = mediaEl;

      if (this.bufferingTimeout_) {
        clearTimeout(this.bufferingTimeout_);
      }

      this.eventCallback(Event.SEEKED, {
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
        this.eventCallback(Event.TIMECHANGED, {
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

    this.mediaElEventHandlers.push({event, handler: boundHandler});
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
      width: width,
      height: height,
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

    this.eventCallback(Event.READY, info);
  }

  /**
   * Should only be calld when a mediaEl is attached
   */
  unregisterMediaElement() {
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }

    const mediaEl = this.mediaEl;

    this.mediaElEventHandlers.forEach((item: {event: string; handler: any}) => {
      mediaEl.removeEventListener(item.event, item.handler);
    });

    this.resetMedia();
  }

  onBuffering() {
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }
    const {currentTime} = this.mediaEl;

    // this handler may be called multiple times
    // for one actual buffering-event occuring so lets guard from
    // triggering this event redundantly.
    if (this.isBuffering_ || this.isPaused_) {
      return;
    }

    this.eventCallback(Event.START_BUFFERING, {
      currentTime,
    });

    this.isBuffering_ = true;
  }

  onPaused() {
    if (this.isPaused_) {
      return;
    }
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }

    const {currentTime} = this.mediaEl;

    this.eventCallback(Event.PAUSE, {
      currentTime,
    });

    this.isPaused_ = true;
  }

  checkPlayheadProgress() {
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }
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
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }

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
        this.eventCallback(Event.VIDEO_CHANGE, eventData);
      }

      this.analyticsBitrate_ = bitrate;
    }
  }
}
