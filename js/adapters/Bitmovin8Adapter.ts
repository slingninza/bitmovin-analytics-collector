import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {PlayerSourceConfig} from '../types/PlayerSourceConfig';
import {Adapter} from '../types/Adapter';
import {AdapterEventCallback} from '../types/AdapterEventCallback';
import {DrmPerformanceInfo} from '../types/DrmPerformanceInfo';

class Bitmovin8Adapter implements Adapter {
  onBeforeUnLoadEvent: boolean;
  player: any;
  eventCallback: AdapterEventCallback;
  drmPerformanceInfo: DrmPerformanceInfo;

  constructor(player: any, eventCallback: AdapterEventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.drmPerformanceInfo = {drmUsed: false};
    (window as any).player = this.player;
    this.register();
  }

  getPlayerName() {
    return Player.BITMOVIN;
  }

  getPlayerVersion() {
    return this.player.version;
  }

  register() {
    const getProgConfigFromProgressiveConfig = (
      progressive:
        | undefined
        | string
        | any[]
        | any
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
    
    this.player.on(this.player.exports.PlayerEvent.SourceUnloaded, (event: any) => {
      this.eventCallback(Event.SOURCE_UNLOADED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.SourceLoaded, (event: any) => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      //TODO simplify
      const config = {
        source: this.player.getSource(),
      };
      let source: PlayerSourceConfig = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source.videoId = config.source.videoId;
        source.userId = config.source.userId;
        source.mpdUrl = config.source.dash;
        source.m3u8Url = config.source.hls;
        source.title = config.source.title;
        source.progUrl = progConf ? progConf.progUrl : undefined;
        source.progBitrate = progConf ? progConf.progBitrate : undefined;
      }

      this.eventCallback(Event.SOURCE_LOADED, {
        isLive: this.player.isLive(),
        version: this.player.version,
        type: this.player.getPlayerType(),
        duration: this.player.getDuration(),
        streamType: this.player.getStreamType(),
        videoId: source.videoId,
        videoTitle: source.title,
        userId: source.userId,
        mpdUrl: source.mpdUrl,
        m3u8Url: source.m3u8Url,
        progUrl: source.progUrl,
        progBitrate: source.progBitrate,
        videoWindowWidth: this.player.getContainer().offsetWidth,
        videoWindowHeight: this.player.getContainer().offsetHeight,
        isMuted: this.player.isMuted(),
        autoplay,
      });
    });

    this.player.on(this.player.exports.PlayerEvent.CastStarted, (event: any) => {
      this.eventCallback(Event.START_CAST, event);
    });

    this.player.on(this.player.exports.PlayerEvent.CastStopped, () => {
      this.eventCallback(Event.END_CAST, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Play, () => {
      this.eventCallback(Event.PLAY, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Playing, () => {
      this.eventCallback(Event.PLAYING, {
        currentTime: this.player.getCurrentTime(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Paused, (e) => {
      if(e.issuer !== 'ui-seek') {
        this.eventCallback(Event.PAUSE, {
          currentTime: this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedVideoFrames(),
        });
      }
    });

    this.player.on(this.player.exports.PlayerEvent.TimeChanged, () => {
      this.eventCallback(Event.TIMECHANGED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Seek, () => {
      this.eventCallback(Event.SEEK, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Seeked, () => {
      this.eventCallback(Event.SEEKED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.StallStarted, () => {
      this.eventCallback(Event.START_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.StallEnded, () => {
      this.eventCallback(Event.END_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.AudioPlaybackQualityChanged, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Event.AUDIO_CHANGE, {
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.VideoPlaybackQualityChanged, () => {
      const quality = this.player.getPlaybackVideoData();

      this.eventCallback(Event.VIDEO_CHANGE, {
        width: quality.width,
        height: quality.height,
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.ViewModeChanged, (e: any) => {
      if (e.to === 'fullscreen') {
        this.eventCallback(Event.START_FULLSCREEN, {
          currentTime: this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedVideoFrames(),
        });
      } else if (e.from === 'fullscreen') {
        this.eventCallback(Event.END_FULLSCREEN, {
          currentTime: this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedVideoFrames(),
        });
      }
    });

    this.player.on(this.player.exports.PlayerEvent.AdStarted, () => {
      this.eventCallback(Event.START_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.AdFinished, () => {
      this.eventCallback(Event.END_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Muted, () => {
      this.eventCallback(Event.MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Unmuted, () => {
      this.eventCallback(Event.UN_MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.Error, (event: any) => {
      this.eventCallback(Event.ERROR, {
        code: event.code,
        message: event.message,
        currentTime: this.player.getCurrentTime(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.PlaybackFinished, () => {
      this.eventCallback(Event.PLAYBACK_FINISHED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.DownloadFinished, (event: any) => {      
      if (event.downloadType.indexOf('drm/license/') === 0) {
        this.drmPerformanceInfo.drmTime = event.downloadTime * 1000;
        this.drmPerformanceInfo.drmInfo = event.downloadType.replace('drm/license/', '');
        this.drmPerformanceInfo.drmUsed = true;
      }
    });

    window.onunload = window.onbeforeunload = () => {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.eventCallback(Event.UNLOAD, {
          currentTime: this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedVideoFrames(),
        });
      }
    };
  }
}

export default Bitmovin8Adapter;
