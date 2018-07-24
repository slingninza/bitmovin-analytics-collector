import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {Adapter} from '../types/Adapter';

export class BitmovinAdapter implements Adapter {
  onBeforeUnLoadEvent: boolean;
  player: any;
  eventCallback: Function;

  constructor(player: any, eventCallback: Function) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.register();
  }

  getPlayerName() {
    return Player.BITMOVIN;
  }

  register() {
    this.player.addEventHandler(this.player.EVENT.ON_SOURCE_LOADED, () => {
      this.eventCallback(Event.SOURCE_LOADED);
    });

    this.player.addEventHandler(this.player.EVENT.ON_READY, () => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      this.eventCallback(Event.READY, {
        isLive: this.player.isLive(),
        version: this.player.getVersion(),
        type: this.player.getPlayerType(),
        duration: this.player.getDuration(),
        streamType: this.player.getStreamType(),
        videoId: this.player.getConfig().source.videoId,
        userId: this.player.getConfig().source.userId,
        mpdUrl: this.player.getConfig().source.dash,
        m3u8Url: this.player.getConfig().source.hls,
        progUrl: this.player.getConfig().source.progressive,
        videoWindowWidth: this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted: this.player.isMuted(),
        autoplay,
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_START, () => {
      this.eventCallback(Event.START_CAST);
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STOP, () => {
      this.eventCallback(Event.END_CAST);
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAY, () => {
      this.eventCallback(Event.PLAY, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PAUSE, () => {
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

    this.player.addEventHandler(this.player.EVENT.ON_START_BUFFERING, () => {
      this.eventCallback(Event.START_BUFFERING);
    });

    this.player.addEventHandler(this.player.EVENT.ON_STOP_BUFFERING, () => {
      this.eventCallback(Event.END_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGE, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Event.AUDIO_CHANGE, {
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, () => {
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
    this.onBeforeUnLoadEvent = false;

    this.player.addEventHandler(this.player.EVENT.ON_FULLSCREEN_EXIT, () => {
      this.eventCallback(Event.END_FULLSCREEN, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_STARTED, () => {
      this.eventCallback(Event.START_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_FINISHED, () => {
      this.eventCallback(Event.END_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_MUTE, () => {
      this.eventCallback(Event.MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_UNMUTE, () => {
      this.eventCallback(Event.UN_MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_ERROR, (event: any) => {
      this.eventCallback(Event.ERROR, {
        code: event.code,
        message: event.message,
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAYBACK_FINISHED, () => {
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
