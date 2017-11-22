import Events from '../enums/Events';

const BUFFERING_TIMECHANGED_TIMEOUT = 1000;

class VideoJsAdapter {
  constructor(player, eventCallback, stateMachine) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.stateMachine = stateMachine;
    this.register();
  }

  getStreamType(url) {
    if (url.endsWith('.m3u8')) {
      return 'hls';
    }
    if (url.endsWith('.mpd')) {
      return 'dash';
    }
    return 'progressive';
  }

  getStreamSources(url) {
    let mpdUrl       = null;
    let m3u8Url      = null;
    let progUrl      = null;
    const streamType = this.getStreamType(url);
    switch (streamType) {
      case 'hls':
        m3u8Url = url;
        break;
      case 'dash':
        mpdUrl = url;
        break;
      default:
        progUrl = url;
    }
    return {
      mpdUrl,
      m3u8Url,
      progUrl
    }
  }

  getVideoWindowDimensions(player) {
    return {
      width : player.width(),
      height: player.height()
    }
  }

  getVideoSourceDimensions(tech) {
    return {
      videoWidth : tech.videoWidth(),
      videoHeight: tech.videoHeight()
    }
  }

  /**
   * @returns {string} 'native' | 'flash' | 'html5'
   */
  getVideojsSourceHandlerMode_() {
    const tech = this.player.tech({IWillNotUseThisInPlugins: true});

    if (!tech.sourceHandler_) {
      return 'native';
    } else {
      return tech.sourceHandler_.options_.mode;
    }
  }

  register() {
    const that = this;
    this.player.on('loadedmetadata', function() {
      const streamType = that.getStreamType(this.currentSrc());
      const sources    = that.getStreamSources(this.currentSrc());
      const mode = that.getVideojsSourceHandlerMode_();
      const info       = {
        isLive     : this.duration() === Infinity,
        version    : videojs.VERSION,
        type       : mode,
        duration   : this.duration(),
        streamType,
        autoplay   : this.autoplay(),
        ...sources,
        ...that.getVideoWindowDimensions(this),
        videoWindowWidth : this.videoWidth(),
        videoWindowHeight: this.videoHeight(),
        muted      : this.muted()
      };
      that.stateMachine.updateMetadata(info);
    });
    this.player.ready(function() {
      const streamType = that.getStreamType(this.currentSrc());
      const sources    = that.getStreamSources(this.currentSrc());
      const mode = that.getVideojsSourceHandlerMode_();
      const info       = {
        isLive     : false,
        version    : videojs.VERSION,
        type       : mode,
        duration   : this.duration(),
        streamType,
        autoplay   : this.autoplay(),
        ...sources,
        ...that.getVideoWindowDimensions(this),
        videoWindowWidth : this.videoWidth(),
        videoWindowHeight: this.videoHeight(),
        muted      : this.muted()
      };
      that.eventCallback(Events.READY, info);
    });
    this.player.on('play', function() {
      that.eventCallback(Events.PLAY, {
        currentTime: this.currentTime()
      })
    });
    this.player.on('pause', function() {
      that.eventCallback(Events.PAUSE, {
        currentTime: this.currentTime()
      })
    });
    this.player.on('error', function() {
      const error = this.error();
      that.eventCallback(Events.ERROR, {
        currentTime: this.currentTime(),
        code       : error.code,
        message    : error.message
      });
    });
    this.player.on('volumechange', function() {
      const muted = this.muted();
      if (muted) {
        that.eventCallback(Events.MUTE, {
          currentTime: this.currentTime()
        })
      } else {
        that.eventCallback(Events.UN_MUTE, {
          currentTime: this.currentTime()
        });
      }
    });
    this.player.on('seeking', function () {
      that.eventCallback(Events.SEEK, {
        currentTime: this.currentTime(),
        droppedFrames: 0
      });
    });
    this.player.on('seeked', function () {
      that.eventCallback(Events.SEEKED, {
        currentTime: this.currentTime(),
        droppedFrames: 0
      });
    });

    let analyticsBitrate;
    let bufferingTimeout;
    let lastTimeupdate   = Date.now();
    let isStalling       = false;

    this.player.on('timeupdate', function() {
      clearTimeout(bufferingTimeout);
      isStalling     = false;
      lastTimeupdate = Date.now();

      that.eventCallback(Events.TIMECHANGED, {
        currentTime: this.currentTime()
      });

      bufferingTimeout = window.setTimeout(() => {
        if ((this.paused() || this.ended()) && !isStalling) {
          return;
        }

        that.eventCallback(Events.START_BUFFERING, {
          currentTime: this.currentTime()
        });
      }, BUFFERING_TIMECHANGED_TIMEOUT);

      // Check for HLS source-handler (videojs-contrib-hls)
      // When we just use Videojs without any specific source-handler (not using MSE API based engine)
      // but just native technology (HTML5/Flash) to do for example "progressive download" with plain Webm/Mp4
      // or use native HLS on Safari this may not not be present. In that case Videojs is just
      // a wrapper around the respective playback tech (HTML or Flash).

      const tech = this.tech({IWillNotUseThisInPlugins: true});
      if (tech.hls) {
  
        // From here we are going onto Videojs-HLS source-handler specific API
        //
        const hls = this.tech_.hls;

        // Maybe we have the HLS source-handler initialized, but it is
        // not actually activated and used (just wrapping HTML5 built-in HLS playback like in Safari)
        if (!hls.playlists || typeof hls.playlists.media !== 'function') {
          return;
        }

        // Check for current media playlist
        const selectedPlaylist = hls.playlists.media();
        if (!selectedPlaylist) {
          return;
        }

        const {attributes} = selectedPlaylist;
        const bitrate      = attributes.BANDWIDTH;
        const width        = attributes.RESOLUTION.width;
        const height       = attributes.RESOLUTION.height;
  
        // update actual bitrate
        if (isNaN(analyticsBitrate) || analyticsBitrate !== bitrate) {
          const eventObject = {
            width,
            height,
            bitrate,
            currentTime: this.currentTime()
          };
  
          that.eventCallback(Events.VIDEO_CHANGE, eventObject);
          analyticsBitrate = bitrate;
        }
      }
  
    });

    this.player.on('stalled', function() {
      isStalling = true;
    });

    window.onunload = window.onbeforeunload = () => {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.eventCallback(Events.UNLOAD, {
          currentTime: this.player.currentTime()
        });
      }
    };
  }
}

export default VideoJsAdapter
