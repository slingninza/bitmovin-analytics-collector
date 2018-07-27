import Events from '../enums/Events';
import {Players} from '../enums/Players';

class Bitmovin8Adapter {
  constructor(player, eventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.register();
  }

  getPlayerName() {
    return Players.BITMOVIN;
  }

  register() {
    const getProgConfigFromProgressiveConfig = (progressive) => {
      if (!progressive) {
        return {
          progUrl: undefined,
          progBitrate: undefined
        };
      }

      if (typeof progressive === 'string') {
        return {
          progUrl: progressive,
          progBitrate: 0
        };
      }

      if (Array.isArray(progressive)) {
        const playbackVideoData = this.player.getPlaybackVideoData();
        const progressiveArrayIndex = parseInt(playbackVideoData.id) || 0;
        return {
          progUrl: progressive[progressiveArrayIndex].url,
          progBitrate: progressive[progressiveArrayIndex].bitrate || 0,
        };
      }

      if (typeof progressive === 'object') {
        return {
          progUrl: progressive.url,
          progBitrate: progressive.bitrate || 0
        };
      }
    };
    /* eslint-disable no-unused-vars */
    this.player.on(this.player.Event.Sourceloaded, (event) => {
      this.eventCallback(Events.SOURCE_UNLOADED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Sourceloaded, (event) => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source = {
          mpdUrl : config.source.dash,
          m3u8Url: config.source.hls,
          progUrl: progConf.progUrl,
          progBitrate: progConf.progBitrate
        };
      }

      this.eventCallback(Events.SOURCE_LOADED, {
        isLive           : this.player.isLive(),
        version          : this.player.version,
        type             : this.player.getPlayerType(),
        duration         : this.player.getDuration(),
        streamType       : this.player.getStreamType(),
        mpdUrl           : source.mpdUrl,
        m3u8Url          : source.m3u8Url,
        progUrl          : source.progUrl,
        progBitrate      : source.progBitrate,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted          : this.player.isMuted(),
        autoplay
      });
    });

    this.player.on(this.player.Event.Ready, () => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source = {
          videoId: config.source.videoId,
          userId : config.source.userId,
          mpdUrl : config.source.dash,
          m3u8Url: config.source.hls,
          progUrl: progConf.progUrl,
          progBitrate: progConf.progBitrate
        };
      }

      this.eventCallback(Events.READY, {
        isLive           : this.player.isLive(),
        version          : this.player.version,
        type             : this.player.getPlayerType(),
        duration         : this.player.getDuration(),
        streamType       : this.player.getStreamType(),
        videoId          : source.videoId,
        userId           : source.userId,
        mpdUrl           : source.mpdUrl,
        m3u8Url          : source.m3u8Url,
        progUrl          : source.progUrl,
        progBitrate      : source.progBitrate,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted          : this.player.isMuted(),
        autoplay
      });
    });

    this.player.on(this.player.Event.CastStarted, (event) => {
      this.eventCallback(Events.START_CAST, event);
    });

    this.player.on(this.player.Event.CastStopped , () => {
      this.eventCallback(Events.END_CAST, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Play, () => {
      this.eventCallback(Events.PLAY, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Paused, () => {
      this.eventCallback(Events.PAUSE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.TimeChanged, () => {
      this.eventCallback(Events.TIMECHANGED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Seek, () => {
      this.eventCallback(Events.SEEK, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Seeked, () => {
      this.eventCallback(Events.SEEKED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event. StallStarted , () => {
      this.eventCallback(Events.START_BUFFERING, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.StallEnded , () => {
      this.eventCallback(Events.END_BUFFERING, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.AudioPlaybackQualityChanged, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.VideoPlaybackQualityChanged, () => {
      const quality = this.player.getPlaybackVideoData();

      this.eventCallback(Events.VIDEO_CHANGE, {
        width        : quality.width,
        height       : quality.height,
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.FullscreenEnter, () => {
      this.eventCallback(Events.START_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.FullscreenExit, () => {
      this.eventCallback(Events.END_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.AdStarted, () => {
      this.eventCallback(Events.START_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.AdFinished, () => {
      this.eventCallback(Events.END_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Muted, () => {
      this.eventCallback(Events.MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Unmuted, () => {
      this.eventCallback(Events.UN_MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.on(this.player.Event.Error, (event) => {
      this.eventCallback(Events.ERROR, {
        code   : event.code,
        message: event.message,
        currentTime  : this.player.getCurrentTime()
      });
    });

    this.player.on(this.player.Event.PlaybackFinished, () => {
      this.eventCallback(Events.PLAYBACK_FINISHED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    window.onunload = window.onbeforeunload = () => {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.eventCallback(Events.UNLOAD, {
          currentTime  : this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedFrames()
        });
      }
    };
  }
}

export default Bitmovin8Adapter;