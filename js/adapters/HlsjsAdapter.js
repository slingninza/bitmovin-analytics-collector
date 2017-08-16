import Events from '../enums/Events';

import Hls from 'hls.js';

const BUFFERING_TIMECHANGED_TIMEOUT = 1000;

export default class HlsjsAdapter {

  constructor(hls, eventCallback, stateMachine) {

    this.eventCallback = eventCallback;
    this.stateMachine = stateMachine;
    this.hls = hls;

    // privates
    this.analyticsBitrate_ = -1;
    this.bufferingTimeout_ = null;
    this.isBuffering_       = false;
    this.isLive_ = false;
    this.m3u8Url_ = null;
    this.isPaused_ = false;
    this.previousMediaTime_ = null;

    this.resetMedia();
    this.register();
  }

  resetMedia() {
    this.mediaEl = null; // HTMLMediaElement
    this.mediaElEventHandlers = [];
  }

  register() {
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

  registerMediaElement() {

    const mediaEl = this.mediaEl;
    const hls = this.hls;

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

      this.checkQualityLevelAttributes(true); // silent

      const {duration, autoplay, 
          width, height, 
          videoWidth, videoHeight,
          muted} = mediaEl;

      // This is redundant with what we give to updateMetadata method.
      // Not sure if there are good reasons to keep that so or if we should better centralize.
      const info       = {
        m3u8Url    : this.m3u8Url_,
        isLive     : this.isLive_,
        version    : Hls.version,
        type       : 'html5',
        streamType : 'hls',
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

      this.eventCallback(Events.METADATA_LOADED, info);
    });

    // We need the PLAY event to indicate the intent to play
    // NOTE: use TIMECHANGED event on 'playing' and trigger PLAY as intended in states.dot graph

    this.listenToMediaElementEvent('play', () => {
      const {currentTime} = mediaEl;

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

      console.log('timeupdate');

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
      console.log('stalled');
      // this event doesn't indicate buffering by definition (interupted playback),
      // only that data throughput to playout buffers is not as high as expected
      // It happens on Chrome every once in a while as SourceBuffer's are not fed
      // as fast as the underlying native player may prefer (but it does not lead to
      // interuption). 
    });

    // The waiting event is fired when playback has stopped because of a temporary lack of data.
    // See https://developer.mozilla.org/en-US/docs/Web/Events/waiting
    this.listenToMediaElementEvent('waiting', () => {
      console.log('waiting');
      this.onBuffering();
    });

  }

  /**
   * Should only be calld when a mediaEl is attached
   */
  unregisterMediaElement() {
    if (!this.mediaEl) {
      throw new Error('No media attached');
    }

    this.mediaElEventHandlers.forEach((handler) => {
      this.mediaEl.removeEventListener(handler);
    });

    this.resetMedia();
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

  onMediaAttaching() {
    // in case we are called again (when we are triggering this ourselves
    // but from the event handler of MEDIA_ATTACHING) we should not run again.
    if (this.mediaEl) {
      return;
    }

    this.mediaEl = hls.media;

    this.registerMediaElement();

    console.log('SOURCE_LOADED');

    this.eventCallback(Events.SOURCE_LOADED);
  }

  onMediaDetaching() {
    this.unregisterMediaElement();
  }

  onManifestLoading() {
    // we don't care how often this gets called, its just a help-out
    this.m3u8Url_ = this.hls.url;

    const {duration, autoplay, 
        width, height, 
        videoWidth, videoHeight,
        muted} = this.mediaEl;

    const info       = {
      m3u8Url    : this.m3u8Url_,
      isLive     : this.isLive_,
      version    : Hls.version,
      type       : 'html5',
      streamType : 'hls',
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

    // where is "METADATA_LOADING"?
    //this.eventCallback(Events.METADATA_LOADING);
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

    console.log('pause');
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
    const hls = this.hls;

    // This is not the currently played level 
    // but the one which we are currently selecting for loading segments.
    // We dont have a segment-metadata cue track like videojs-contrib-hls has.
    const currentLevelObj = hls.levels[hls.currentLevel];
    if (!currentLevelObj) {
      return;
    }

    const attributes   = currentLevelObj.attrs;
    const bitrate      = attributes.BANDWIDTH;
    const width        = attributes.RESOLUTION.width;
    const height       = attributes.RESOLUTION.height;

    const isLive = currentLevelObj.details.live;

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
        bitrate,
        currentTime: mediaEl.currentTime
      };

      !silent && this.eventCallback(Events.VIDEO_CHANGE, eventObject);
      this.analyticsBitrate_ = bitrate;
    }
  }
}