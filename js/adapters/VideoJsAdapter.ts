/* global videojs */

import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {Adapter} from '../types/Adapter';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';
declare var videojs: any;

const BUFFERING_TIMECHANGED_TIMEOUT = 1000;

class VideoJsAdapter implements Adapter {
  onBeforeUnLoadEvent: boolean;
  player: any;
  eventCallback: Function;
  stateMachine: AnalyticsStateMachine;

  constructor(player: any, eventCallback: Function, stateMachine: AnalyticsStateMachine) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.stateMachine = stateMachine;
    this.register();
  }

  getPlayerName() {
    return Player.VIDEOJS;
  }

  getStreamType(url: string) {
    if (url.endsWith('.m3u8')) {
      return 'hls';
    }
    if (url.endsWith('.mpd')) {
      return 'dash';
    }
    return 'progressive';
  }

  // this seems very generic. one could put it in a helper
  // and use it in many adapter implementations.
  getStreamSources(url: string) {
    let mpdUrl = null;
    let m3u8Url = null;
    let progUrl = null;
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
      progUrl,
    };
  }

  getVideoWindowDimensions(player: any) {
    return {
      width: player.width(),
      height: player.height(),
    };
  }

  getVideoSourceDimensions(tech: any) {
    return {
      videoWidth: tech.videoWidth(),
      videoHeight: tech.videoHeight(),
    };
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
    this.player.on('loadedmetadata', function(this: any) {
      const streamType = that.getStreamType(this.currentSrc());
      const sources = that.getStreamSources(this.currentSrc());
      const mode = that.getVideojsSourceHandlerMode_();
      const info = {
        isLive: this.duration() === Infinity,
        version: videojs.VERSION,
        type: mode,
        duration: this.duration(),
        streamType,
        autoplay: this.autoplay(),
        ...sources,
        ...that.getVideoWindowDimensions(this),
        videoWindowWidth: this.videoWidth(),
        videoWindowHeight: this.videoHeight(),
        muted: this.muted(),
      };
      that.stateMachine.updateMetadata(info);
    });
    this.player.ready(function(this: any) {
      const streamType = that.getStreamType(this.currentSrc());
      const sources = that.getStreamSources(this.currentSrc());
      const mode = that.getVideojsSourceHandlerMode_();
      const info = {
        isLive: false,
        version: videojs.VERSION,
        type: mode,
        duration: this.duration(),
        streamType,
        autoplay: this.autoplay(),
        ...sources,
        ...that.getVideoWindowDimensions(this),
        videoWindowWidth: this.videoWidth(),
        videoWindowHeight: this.videoHeight(),
        muted: this.muted(),
      };
      that.eventCallback(Event.READY, info);
    });
    this.player.on('play', function(this: any) {
      that.eventCallback(Event.PLAY, {
        currentTime: this.currentTime(),
      });
    });
    this.player.on('pause', function(this: any) {
      that.eventCallback(Event.PAUSE, {
        currentTime: this.currentTime(),
      });
    });
    this.player.on('error', function(this: any) {
      const error = this.error();
      that.eventCallback(Event.ERROR, {
        currentTime: this.currentTime(),
        code: error.code,
        message: error.message,
      });
    });
    this.player.on('volumechange', function(this: any) {
      const muted = this.muted();
      if (muted) {
        that.eventCallback(Event.MUTE, {
          currentTime: this.currentTime(),
        });
      } else {
        that.eventCallback(Event.UN_MUTE, {
          currentTime: this.currentTime(),
        });
      }
    });
    this.player.on('seeking', function(this: any) {
      that.eventCallback(Event.SEEK, {
        currentTime: this.currentTime(),
        droppedFrames: 0,
      });
    });
    this.player.on('seeked', function(this: any) {
      that.eventCallback(Event.SEEKED, {
        currentTime: this.currentTime(),
        droppedFrames: 0,
      });
    });

    let analyticsBitrate: any;
    let bufferingTimeout: any;
    // eslint-disable-next-line
    let lastTimeupdate = Date.now();
    let isStalling = false;

    this.player.on('timeupdate', function(this: any) {
      clearTimeout(bufferingTimeout);
      isStalling = false;
      lastTimeupdate = Date.now();

      that.eventCallback(Event.TIMECHANGED, {
        currentTime: this.currentTime(),
      });

      // that is not the quality that is currently being played.
      // for more accuracy one can use the segment-metadata cue tracking:
      // https://github.com/videojs/videojs-contrib-hls#segment-metadata
      const selectedPlaylist = this.tech_.hls.playlists.media();
      if (!selectedPlaylist) {
        return;
      }

      const {attributes} = selectedPlaylist;
      const bitrate = attributes.BANDWIDTH;
      const width = attributes.RESOLUTION.width;
      const height = attributes.RESOLUTION.height;

      if (analyticsBitrate !== bitrate) {
        const eventObject = {
          width,
          height,
          bitrate,
          currentTime: this.currentTime(),
        };

        that.eventCallback(Event.VIDEO_CHANGE, eventObject);
        analyticsBitrate = bitrate;
      }

      bufferingTimeout = window.setTimeout(() => {
        if ((this.paused() || this.ended()) && !isStalling) {
          return;
        }

        that.eventCallback(Event.START_BUFFERING, {
          currentTime: this.currentTime(),
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
        const bitrate = attributes.BANDWIDTH;
        const width = attributes.RESOLUTION.width;
        const height = attributes.RESOLUTION.height;

        // update actual bitrate
        if (isNaN(analyticsBitrate) || analyticsBitrate !== bitrate) {
          const eventObject = {
            width,
            height,
            bitrate,
            currentTime: this.currentTime(),
          };

          that.eventCallback(Event.VIDEO_CHANGE, eventObject);
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
        this.eventCallback(Event.UNLOAD, {
          currentTime: this.player.currentTime(),
        });
      }
    };
  }
}

export default VideoJsAdapter;
