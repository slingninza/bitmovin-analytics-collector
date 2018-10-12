import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {Adapter} from '../types/Adapter';
import {AdapterEventCallback} from '../types/AdapterEventCallback';
import {DrmPerformanceInfo} from '../types/DrmPerformanceInfo';
import {PlaybackInfo} from '../types/PlaybackInfo';
import { SourceInfo } from '../types/SourceInfo';
import { ProgressiveSourceConfig } from '../types/ProgressiveSourceConfig';
import { getSourceInfoFromBitmovinSourceConfig } from '../utils/BitmovinProgressiveSourceHelper';
import {AdClickedEvent, AdQuartileEvent, ErrorEvent, AdEvent, AdBreakEvent} from 'bitmovin-player';
import { AdAdapter } from '../types/AdAdapter';

class Bitmovin8Adapter implements Adapter, AdAdapter {

  onBeforeUnLoadEvent: boolean;
  player: any;
  eventCallback: AdapterEventCallback;
  drmPerformanceInfo: DrmPerformanceInfo;

  onAdStarted: (event: AdEvent) => void = () => {};
  onAdFinished: (event: AdEvent) => void = () => {};
  onAdBreakStarted: (event: AdBreakEvent) => void = () => {};
  onAdBreakFinished: (event: AdBreakEvent) => void = () => {};
  onAdClicked: (event: AdClickedEvent) => void = () => {};
  onAdError: (event: ErrorEvent) => void = () => {};
  onAdManifestLoaded: (event: AdBreakEvent) => void = () => {};
  onAdQuartile: (event: AdQuartileEvent) => void = () => {};
  onAdSkipped: (event: AdEvent) => void = () => {};
  onPlay: (issuer: string) => void = () => {};
  onPause: (issuer: string) => void = () => {};
  onBeforeUnload: () => void = () => {};
  getAdAdapter = (): AdAdapter => this;

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

  isLinearAdActive = () => this.player.ads && this.player.ads.isLinearAdActive();
  getContainer = () => this.player.getContainer();
  getAdModule = () => 'IMAModule';

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

    this.player.on(this.player.exports.PlayerEvent.Play, (e) => {
      this.eventCallback(Event.PLAY, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
      this.onPlay(e.issuer);
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

      this.onPause(e.issuer);
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

    this.player.on(this.player.exports.PlayerEvent.AdBreakStarted, (event: AdBreakEvent) => {
      this.eventCallback(Event.START_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
      this.onAdBreakStarted(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdBreakFinished, (event: AdBreakEvent) => {
      this.eventCallback(Event.END_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedVideoFrames(),
      });
      this.onAdBreakFinished(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdStarted, (event: AdEvent) => {
      this.onAdStarted(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdFinished, (event: AdEvent) => {
      this.onAdFinished(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdClicked, (event: AdClickedEvent) => {
      this.onAdClicked(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdQuartile, (event: AdQuartileEvent) => {
      this.onAdQuartile(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdSkipped, (event: AdEvent) => {
      this.onAdSkipped(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdError, (event: ErrorEvent) => {
      this.onAdError(event);
    });
    this.player.on(this.player.exports.PlayerEvent.AdManifestLoaded, (event: AdBreakEvent) => {
      this.onAdManifestLoaded(event);
    });

    window.onunload = window.onbeforeunload = () => {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.onBeforeUnload();
        this.eventCallback(Event.UNLOAD, {
          currentTime: this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedVideoFrames(),
        });
      }
    };
  }
}

export default Bitmovin8Adapter;
