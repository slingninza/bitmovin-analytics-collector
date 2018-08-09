import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {PlayerSourceConfig} from '../types/PlayerSourceConfig';
import 'bitmovin-player-ui/dist/js/framework/main';
import {Adapter} from '../types/Adapter';
import {AdapterEventCallback} from '../types/AdapterEventCallback';

class Bitmovin8Adapter implements Adapter {
  onBeforeUnLoadEvent: boolean;
  player: any;
  eventCallback: AdapterEventCallback;

  constructor(player: any, eventCallback: AdapterEventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.register();
  }

  getPlayerName() {
    return Player.BITMOVIN;
  }

  register() {
    const getProgConfigFromProgressiveConfig = (
      progressive:
        | undefined
        | string
        | bitmovin.PlayerAPI.ProgressiveSourceConfig[]
        | bitmovin.PlayerAPI.ProgressiveSourceConfig
    ) => {
      if (!progressive) {
        return {
          progUrl: undefined,
          progBitrate: undefined,
        };
      }

      if (typeof progressive === 'string') {
        return {
          progUrl: progressive,
          progBitrate: 0,
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
          progBitrate: progressive.bitrate || 0,
        };
      }
    };
    /* eslint-disable no-unused-vars */
    this.player.on(this.player.Event.SourceUnloaded, (event: bitmovin.PlayerAPI.PlayerEvent) => {
      this.eventCallback(Event.SOURCE_UNLOADED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Sourceloaded, (event: bitmovin.PlayerAPI.PlayerEvent) => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source: PlayerSourceConfig = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source.mpdUrl = config.source.dash;
        source.m3u8Url = config.source.hls;
        source.progUrl = progConf ? progConf.progUrl : undefined;
        source.progBitrate = progConf ? progConf.progBitrate : undefined;
      }

      this.eventCallback(Event.SOURCE_LOADED, {
        isLive: this.player.isLive(),
        version: this.player.version,
        type: this.player.getPlayerType(),
        duration: this.player.getDuration(),
        streamType: this.player.getStreamType(),
        mpdUrl: source.mpdUrl,
        m3u8Url: source.m3u8Url,
        progUrl: source.progUrl,
        progBitrate: source.progBitrate,
        videoWindowWidth: this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted: this.player.isMuted(),
        autoplay,
      });
    });

    this.player.on(this.player.Event.Ready, () => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source: PlayerSourceConfig = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source.videoId = config.source.videoId;
        source.userId = config.source.userId;
        source.mpdUrl = config.source.dash;
        source.m3u8Url = config.source.hls;
        source.progUrl = progConf ? progConf.progUrl : undefined;
        source.progBitrate = progConf ? progConf.progBitrate : undefined;
      }

      this.eventCallback(Event.READY, {
        isLive: this.player.isLive(),
        version: this.player.version,
        type: this.player.getPlayerType(),
        duration: this.player.getDuration(),
        streamType: this.player.getStreamType(),
        videoId: source.videoId,
        userId: source.userId,
        mpdUrl: source.mpdUrl,
        m3u8Url: source.m3u8Url,
        progUrl: source.progUrl,
        progBitrate: source.progBitrate,
        videoWindowWidth: this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted: this.player.isMuted(),
        autoplay,
      });
    });

    this.player.on(this.player.Event.CastStarted, (event: bitmovin.PlayerAPI.PlayerEvent) => {
      this.eventCallback(Event.START_CAST, event);
    });

    this.player.on(this.player.Event.CastStopped, () => {
      this.eventCallback(Event.END_CAST, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Play, () => {
      this.eventCallback(Event.PLAY, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Paused, () => {
      this.eventCallback(Event.PAUSE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.TimeChanged, () => {
      this.eventCallback(Event.TIMECHANGED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Seek, () => {
      this.eventCallback(Event.SEEK, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Seeked, () => {
      this.eventCallback(Event.SEEKED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.StallStarted, () => {
      this.eventCallback(Event.START_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.StallEnded, () => {
      this.eventCallback(Event.END_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.AudioPlaybackQualityChanged, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Event.AUDIO_CHANGE, {
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.VideoPlaybackQualityChanged, () => {
      const quality = this.player.getPlaybackVideoData();

      this.eventCallback(Event.VIDEO_CHANGE, {
        width: quality.width,
        height: quality.height,
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.FullscreenEnter, () => {
      this.eventCallback(Event.START_FULLSCREEN, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.FullscreenExit, () => {
      this.eventCallback(Event.END_FULLSCREEN, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.AdStarted, () => {
      this.eventCallback(Event.START_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.AdFinished, () => {
      this.eventCallback(Event.END_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Muted, () => {
      this.eventCallback(Event.MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Unmuted, () => {
      this.eventCallback(Event.UN_MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.on(this.player.Event.Error, (event: any) => {
      this.eventCallback(Event.ERROR, {
        code: event.code,
        message: event.message,
        currentTime: this.player.getCurrentTime(),
      });
    });

    this.player.on(this.player.Event.PlaybackFinished, () => {
      this.eventCallback(Event.PLAYBACK_FINISHED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    window.onunload = window.onbeforeunload = () => {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.eventCallback(Event.UNLOAD, {
          currentTime: this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedFrames(),
        });
      }
    };
  }
}

export default Bitmovin8Adapter;
