import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {Adapter} from '../types/Adapter';
import {AdapterEventCallback} from '../types/AdapterEventCallback';
import {DrmPerformanceInfo} from '../types/DrmPerformanceInfo';
import {AdClickedEvent, AdQuartileEvent, ErrorEvent, AdEvent, AdBreakEvent} from 'bitmovin-player';
import {AdCallbacks} from '../types/ads/AdCallbacks';
import {PlaybackInfo} from '../types/PlaybackInfo';
import {getSourceInfoFromBitmovinSourceConfig} from '../utils/BitmovinProgressiveSourceHelper';

class Bitmovin8Adapter implements Adapter {
  onBeforeUnLoadEvent: boolean;
  player: any;
  eventCallback: AdapterEventCallback;
  adCallbacks?: AdCallbacks;
  drmPerformanceInfo: DrmPerformanceInfo;

  constructor(player: any, eventCallback: AdapterEventCallback, adCallbacks?: AdCallbacks) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.adCallbacks = adCallbacks;
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

  private getAutoPlay(): boolean {
    if (this.player.getConfig().playback) {
      return this.player.getConfig().playback.autoplay || false;
    }
    return false
  }


  getCurrentPlaybackInfo(): PlaybackInfo {
    const sourceInfo: any = {}
    const source = this.player.getSource()
    if (source) {
      const progSourceInfo = getSourceInfoFromBitmovinSourceConfig(source.progressive, this.player);
      sourceInfo.videoTitle = source.title;
      sourceInfo.mpdUrl = source.dash;
      sourceInfo.m3u8Url = source.hls;
      sourceInfo.progUrl = progSourceInfo.progUrl;
      sourceInfo.progBitrate = progSourceInfo.progBitrate;
    }
    return {
      isLive: this.player.isLive(),
      version: this.player.version,
      playerTech: this.player.getPlayerType(),
      videoDuration: this.player.getDuration(),
      streamFormat: this.player.getStreamType(),
      videoWindowWidth: this.player.getContainer().offsetWidth,
      videoWindowHeight: this.player.getContainer().offsetHeight,
      isMuted: this.player.isMuted(),
      autoplay: this.getAutoPlay(),
      ...sourceInfo
    }
  }

  register() {
    this.player.on(this.player.exports.PlayerEvent.SourceUnloaded, (event: any) => {
      this.eventCallback(Event.SOURCE_UNLOADED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });

    this.player.on(this.player.exports.PlayerEvent.SourceLoaded, (event: any) => {
      this.eventCallback(Event.SOURCE_LOADED, {});
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

    this.player.on(this.player.exports.PlayerEvent.AdBreakStarted, (event: AdBreakEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdBreakStarted(event);
      }
      this.eventCallback(Event.START_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });
    this.player.on(this.player.exports.PlayerEvent.AdBreakFinished, (event: AdBreakEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdBreakFinished(event);
      }
      this.eventCallback(Event.END_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
    });
    this.player.on(this.player.exports.PlayerEvent.AdStarted, (event: AdEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdStarted(event);
      }
    });
    this.player.on(this.player.exports.PlayerEvent.AdFinished, (event: AdEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdFinished(event);
      }
    });
    this.player.on(this.player.exports.PlayerEvent.AdClicked, (event: AdClickedEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdClicked(event);
      }
    });
    this.player.on(this.player.exports.PlayerEvent.AdQuartile, (event: AdQuartileEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdQuartile(event);
      }
    });
    this.player.on(this.player.exports.PlayerEvent.AdSkipped, (event: AdEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdSkipped(event);
      }
    });
    this.player.on(this.player.exports.PlayerEvent.AdError, (event: ErrorEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdError(event);
      }
    });
    this.player.on(this.player.exports.PlayerEvent.AdManifestLoaded, (event: AdBreakEvent) => {
      if (this.adCallbacks) {
        this.adCallbacks.onAdManifestLoaded(event);
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
