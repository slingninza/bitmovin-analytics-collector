/**
 * @author Stephan Hesse <tchakabam@gmail.com>
 */

import Events from '../enums/Events';

import Hls from 'hls.js';

const BUFFERING_TIMECHANGED_TIMEOUT = 1000;

export default class HlsjsAdapter {

  constructor(shakaPlayer, eventCallback, stateMachine) {

    /**
     * @member {AnalyticsEventCallback}
     */
    this.eventCallback = eventCallback;

    /**
     * @member {AnalyticsStateMachine}
     */
    this.stateMachine = stateMachine;

    /**
     * @member {shaka.Player}
     */
    this.shakaPlayer = shakaPlayer;

    /**
     * @member {HTMLMediaElement}
     */
    this.mediaEl = null

    /**
     * @member {function[]}
     */
    this.mediaElEventHandlers = []

    // privates
    this.analyticsBitrate_ = -1;
    this.bufferingTimeout_ = null;
    this.isBuffering_ = false;
    this.isLive_ = false;
    this.isPaused_ = false;
    this.previousMediaTime_ = null;
    this.needsReadyEvent_ = true;
    this.needsFirstPlayIntent_ = true;

    this.register();
    this.registerMediaElement();
    this.onMaybeReady();
  }

  register() {
    const shakaPlayer = this.shakaPlayer;

    this.mediaEl = shakaPlayer.getMediaElement();

    if (!shaka) {
      throw new Error('`shaka` lib is not installed (must be loaded before analytics module)');
    }
  }

  registerMediaElement() {

    const mediaEl = this.mediaEl;
    const shakaPlayer = this.shakaPlayer;

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

      const {duration, autoplay,
        width, height,
        videoWidth, videoHeight,
        muted} = mediaEl;

      // This is redundant with what we give to updateMetadata method.
      // Not sure if there are good reasons to keep that so or if we should better centralize.
      const info       = {
        isLive     : this.isLive_,
        version    : shaka.Player.version,
        type       : 'html5',
        streamType : 'dash',
        duration,
        autoplay,
        // HTMLVideoElement.width and HTMLVideoElement.height
        // is a DOMString that reflects the height HTML attribute,
        // which specifies the height of the display area, in CSS pixels.
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
        width      : parseInt(width),
        height     : parseInt(height),
        // Returns an unsigned long containing the intrinsic
        // height of the resource in CSS pixels,
        // taking into account the dimensions, aspect ratio,
        // clean aperture, resolution, and so forth,
        // as defined for the format used by the resource.
        // If the element's ready state is HAVE_NOTHING, the value is 0.
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
        videoWindowWidth : videoWidth,
        videoWindowHeight: videoHeight,
        muted
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
        currentTime
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
        currentTime
      });
    });

    this.listenToMediaElementEvent('error', () => {
      const {currentTime, error} = mediaEl;

      this.eventCallback(Events.ERROR, {
        currentTime,
        // See https://developer.mozilla.org/en-US/docs/Web/API/MediaError
        code       : error.code,
        message    : error.message
      });
    });

    this.listenToMediaElementEvent('volumechange', () => {
      const {muted, currentTime} = mediaEl;

      if (muted) {
        this.eventCallback(Events.MUTE, {
          currentTime
        });
      } else {
        this.eventCallback(Events.UN_MUTE, {
          currentTime
        });
      }
    });

    this.listenToMediaElementEvent('seeking', () => {
      const {currentTime} = mediaEl;

      this.eventCallback(Events.SEEK, {
        currentTime,
        droppedFrames: 0
      });
    });

    this.listenToMediaElementEvent('seeked', () => {
      const {currentTime} = mediaEl;

      if (this.bufferingTimeout_) {
        clearTimeout(this.bufferingTimeout_);
      }

      this.eventCallback(Events.SEEKED, {
        currentTime,
        droppedFrames: 0
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
          currentTime
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
  listenToMediaElementEvent(event, handler) {
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

    const {
      duration,
      autoplay,
      width,
      height,
      videoWidth,
      videoHeight,
      muted
    } = this.mediaEl;

    const info       = {
      isLive     : this.isLive_,
      version    : shaka.Player.version,
      type       : 'html5',
      streamType : 'dash',
      duration   : duration,
      autoplay   : autoplay,
      // HTMLVideoElement.width and HTMLVideoElement.height
      // is a DOMString that reflects the height HTML attribute,
      // which specifies the height of the display area, in CSS pixels.
      // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
      width      : parseInt(width),
      height     : parseInt(height),
      // Returns an unsigned long containing the intrinsic
      // height of the resource in CSS pixels,
      // taking into account the dimensions, aspect ratio,
      // clean aperture, resolution, and so forth,
      // as defined for the format used by the resource.
      // If the element's ready state is HAVE_NOTHING, the value is 0.
      // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
      videoWindowWidth : videoWidth,
      videoWindowHeight: videoHeight,
      muted
    };

    this.stateMachine.updateMetadata(info);

    this.eventCallback(Events.READY, info);
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
      currentTime
    });

    this.isBuffering_ = true;
  }

  onPaused() {
    if (this.isPaused_) {
      return;
    }

    const {currentTime} = this.mediaEl;

    this.eventCallback(Events.PAUSE, {
      currentTime
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

      if (mediaEl.paused || mediaEl.ended && !this.isBuffering_) {
        return;
      }

      const timeDelta = mediaEl.currentTime - this.previousMediaTime_;

      if (timeDelta < BUFFERING_TIMECHANGED_TIMEOUT) {
        this.onBuffering();
      }

    }, BUFFERING_TIMECHANGED_TIMEOUT);
  }

  checkQualityLevelAttributes(silent = false) {

    const mediaEl = this.mediaEl;

    const variantTracks = this.shakaPlayer.getVariantTracks();

    const activeVideoTrack = variantTracks
      .filter((track) => track.active)
      .filter((track) => track.videoCodec || track.videoId !== undefined)[0]

    if (!activeVideoTrack) {
      // can only happen for audio-only streams
      return;
    }

    const bitrate      = activeVideoTrack.videoBandwidth || activeVideoTrack.bandwidth;
    const width        = activeVideoTrack.width;
    const height       = activeVideoTrack.height;

    const isLive = this.shakaPlayer.isLive()

    if (isLive !== this.isLive_) {
      this.isLive_ = isLive;
      !silent && this.stateMachine.updateMetadata({
        isLive
      });
    }

    if (this.analyticsBitrate_ !== bitrate) {
      const eventObject = {
        width,
        height,
        bitrate: parseInt(bitrate, 10),
        currentTime: mediaEl.currentTime
      };

      //console.log(eventObject)

      !silent && this.eventCallback(Events.VIDEO_CHANGE, eventObject);
      this.analyticsBitrate_ = bitrate;
    }
  }
}
