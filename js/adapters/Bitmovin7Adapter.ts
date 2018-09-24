import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {SourceInfo} from '../types/SourceInfo';
import {Adapter} from '../types/Adapter';
import {AdapterEventCallback} from '../types/AdapterEventCallback';
import {DrmPerformanceInfo} from '../types/DrmPerformanceInfo';
import {PlaybackInfo} from '../types/PlaybackInfo';
import { getSourceInfoFromBitmovinSourceConfig } from '../utils/BitmovinProgressiveSourceHelper';

export class Bitmovin7Adapter implements Adapter {
  onBeforeUnLoadEvent: boolean;
  player: any;
  eventCallback: AdapterEventCallback;
  drmPerformanceInfo: DrmPerformanceInfo;

  constructor(player: any, eventCallback: AdapterEventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.drmPerformanceInfo = {drmUsed: false};

    this.register();
  }

  getPlayerName() {
    return Player.BITMOVIN;
  }

  getPlayerVersion() {
    return this.player.version;
  }

  private getAutoPlay(): boolean {
    if (this.player.getConfig().playback) {
      return this.player.getConfig().playback.autoplay || false;
    }
    return false
  }

  getCurrentPlaybackInfo(): PlaybackInfo {
    const sourceInfo: any = {}
    const source = this.player.getConfig().source
    if (source) {
      const progSourceInfo = getSourceInfoFromBitmovinSourceConfig(source.progressive, this.player);
      sourceInfo.videoTitle = source.title;
      sourceInfo.mpdUrl = source.mpdUrl;
      sourceInfo.m3u8Url = source.m3u8Url;
      sourceInfo.progUrl = progSourceInfo.progUrl;
      sourceInfo.progBitrate = progSourceInfo.progBitrate;
    }
    return {
      isLive: this.player.isLive(),
      version: this.player.version,
      playerTech: this.player.getPlayerType(),
      videoDuration: this.player.getDuration(),
      streamFormat: this.player.getStreamType(),
      videoWindowWidth: this.player.getFigure().offsetWidth,
      videoWindowHeight: this.player.getFigure().offsetHeight,
      isMuted: this.player.isMuted(),
      autoplay: this.getAutoPlay(),
      ...sourceInfo
    }
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

    this.player.addEventHandler(this.player.EVENT.ON_SOURCE_UNLOADED, (event: any) => {
      this.eventCallback(Event.SOURCE_UNLOADED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SOURCE_LOADED, (event: any) => {
      this.eventCallback(Event.SOURCE_LOADED, {});
    });

    this.player.addEventHandler(this.player.EVENT.ON_READY, () => {
      this.eventCallback(Event.READY, {});
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STARTED, (event: any) => {
      this.eventCallback(Event.START_CAST, event);
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STOPPED, () => {
      this.eventCallback(Event.END_CAST, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAY, () => {
      this.eventCallback(Event.PLAY, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PAUSED, () => {
      this.eventCallback(Event.PAUSE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_TIME_CHANGED, () => {
      this.eventCallback(Event.TIMECHANGED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SEEK, () => {
      this.eventCallback(Event.SEEK, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SEEKED, () => {
      this.eventCallback(Event.SEEKED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_STALL_STARTED, () => {
      this.eventCallback(Event.START_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_STALL_ENDED, () => {
      this.eventCallback(Event.END_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Event.AUDIO_CHANGE, {
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED, () => {
      const quality = this.player.getPlaybackVideoData();

      this.eventCallback(Event.VIDEO_CHANGE, {
        width: quality.width,
        height: quality.height,
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_FULLSCREEN_ENTER, () => {
      this.eventCallback(Event.START_FULLSCREEN, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_FULLSCREEN_EXIT, () => {
      this.eventCallback(Event.END_FULLSCREEN, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_STARTED, (event: any) => {
      this.eventCallback(Event.START_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_FINISHED, (event: any) => {
      this.eventCallback(Event.END_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_MUTED, () => {
      this.eventCallback(Event.MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_UNMUTED, () => {
      this.eventCallback(Event.UN_MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_ERROR, (event: any) => {
      this.eventCallback(Event.ERROR, {
        code: event.code,
        message: event.message,
        currentTime: this.player.getCurrentTime(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAYBACK_FINISHED, () => {
      this.eventCallback(Event.PLAYBACK_FINISHED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_DOWNLOAD_FINISHED, (event: any) => {
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
          droppedFrames: this.player.getDroppedFrames(),
        });
      }
    };
  }
}
