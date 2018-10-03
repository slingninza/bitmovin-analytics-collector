import Utils from '../utils/Utils';
import {logger} from '../utils/Logger';
import {AdapterFactory} from './AdapterFactory';
import {AnalyticsStateMachineFactory} from './AnalyticsStateMachineFactory';
import {AnalyticsStateMachineOptions} from '../types/AnalyticsStateMachineOptions';
import {Sample} from '../types/Sample';
import {StateMachineCallbacks} from '../types/StateMachineCallbacks';
import {Adapter} from '../types/Adapter';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';
import {AnalyicsConfig} from '../types/AnalyticsConfig';
import {Player} from '../enums/Player';
import {CastClientConfig} from '../types/CastClientConfig';
import { Backend, LicenseCheckingBackend } from './Backend';
import {VERSION} from '../Version';

enum PAGE_LOAD_TYPE {
  FOREGROUND = 1,
  BACKGROUND = 2,
}
export class Analytics {
  static LICENSE_CALL_PENDING_TIMEOUT = 200;
  static PAGE_LOAD_TYPE_TIMEOUT = 200;
  static CAST_RECEIVER_CONFIG_MESSAGE = 'CAST_RECEIVER_CONFIG_MESSAGE';

  private config: AnalyicsConfig;
  private backend: Backend
  private droppedSampleFrames: number;
  private startupTime: number;
  private pageLoadType: PAGE_LOAD_TYPE;
  private autoplay: boolean | undefined;
  private sample: Sample;
  private stateMachineCallbacks!: StateMachineCallbacks;
  private analyticsStateMachine!: AnalyticsStateMachine;
  private adapter!: Adapter;

  constructor(config: AnalyicsConfig) {
    this.config = config;

    const domain = Utils.sanitizePath(window.location.hostname);
    this.backend = new LicenseCheckingBackend({ key: config.key, domain: domain, version: VERSION });
    this.sample = {};
    this.droppedSampleFrames = 0;
    this.startupTime = 0;
    this.pageLoadType = PAGE_LOAD_TYPE.FOREGROUND;

    this.autoplay = undefined;

    this.setPageLoadType();

    this.setupSample();
    this.init();
    this.setupStateMachineCallbacks();
  }

  updateSamplesToCastClientConfig(samples: Sample[], castClientConfig: CastClientConfig) {
    for (let i = 0; i < samples.length; i++) {
      this.updateSampleToCastClientConfig(samples[i], castClientConfig);
    }
  }

  updateSampleToCastClientConfig(sample: Sample, castClientConfig: CastClientConfig) {
    const {config, userId, impressionId, domain, path, language, userAgent} = castClientConfig;
    sample.impressionId = impressionId;
    sample.userId = userId;
    sample.userAgent = userAgent;
    sample.domain = domain;
    sample.path = path;
    sample.language = language;

    this.setConfigParameters(sample, config);
  }

  setPageLoadType() {
    window.setTimeout(() => {
      //@ts-ignore
      if (document[Utils.getHiddenProp()] === true) {
        this.pageLoadType = PAGE_LOAD_TYPE.BACKGROUND;
      }
    }, Analytics.PAGE_LOAD_TYPE_TIMEOUT);
  }

  init() {
    if (this.config.key == '' || !Utils.validString(this.config.key)) {
      console.error('Invalid analytics license key provided');
      return;
    }

    logger.setLogging(this.config.debug || false);

    this.setConfigParameters();

    this.generateNewImpressionId();
    this.setUserId();
  }

  setConfigParameters(sample = this.sample, config = this.config) {
    sample.key = config.key;
    sample.playerKey = config.playerKey;
    if (config.player) {
      sample.player = config.player;
    }
    sample.cdnProvider = config.cdnProvider;
    sample.videoId = config.videoId;
    sample.videoTitle = config.title;
    sample.customUserId = config.userId;

    sample.customData1 = Utils.getCustomDataString(config.customData1);
    sample.customData2 = Utils.getCustomDataString(config.customData2);
    sample.customData3 = Utils.getCustomDataString(config.customData3);
    sample.customData4 = Utils.getCustomDataString(config.customData4);
    sample.customData5 = Utils.getCustomDataString(config.customData5);

    sample.experimentName = config.experimentName;
  }

  generateNewImpressionId() {
    this.sample.impressionId = Utils.generateUUID();
  }

  setUserId() {
    const userId = Utils.getCookie('bitmovin_analytics_uuid');
    if (!userId || userId === '') {
      document.cookie = 'bitmovin_analytics_uuid=' + Utils.generateUUID();
      this.sample.userId = Utils.getCookie('bitmovin_analytics_uuid');
    } else {
      this.sample.userId = userId;
    }
  }

  setupStateMachineCallbacks() {
    this.stateMachineCallbacks = {
      // All of these are called in the onLeaveState Method.
      // So it's the last sample
      setup: (time: number, state: string, event: any) => {
        logger.log(
          'Setup bitmovin analytics ' + this.sample.analyticsVersion + ' with impressionId: ' + this.sample.impressionId
        );

        this.setDuration(time);
        this.setState(state);
        this.sample.playerStartupTime = time;
        this.sample.pageLoadType = this.pageLoadType;

        if (window.performance && window.performance.timing) {
          const loadTime = Utils.getCurrentTimestamp() - window.performance.timing.navigationStart;
          this.sample.pageLoadTime = loadTime;
        }

        this.startupTime = time;

        this.setPlaybackInfoFromAdapter();

        this.sendAnalyticsRequestAndClearValues();

        this.sample.pageLoadType = this.pageLoadType;
        this.sample.pageLoadTime = 0;
      },

      ready: Utils.noOp,

      startup: (time: number, state: string) => {
        this.setDuration(time);
        this.sample.videoStartupTime = time;
        this.setState(state);

        if (this.startupTime > 0) {
          this.startupTime += time;
        }
        this.sample.startupTime = this.startupTime;
        this.sample.autoplay = this.autoplay;

        const drmPerformance = this.adapter.drmPerformanceInfo;
        if (drmPerformance.drmUsed) {
          this.sample.drmType = drmPerformance.drmInfo;
          this.sample.drmLoadTime = drmPerformance.drmTime;
        }
        this.sendAnalyticsRequestAndClearValues();
        this.sample.autoplay = undefined;
      },

      updateSample: () => {
        this.setPlaybackInfoFromAdapter();
      },

      playing: (time: number, state: string, event: any) => {
        this.setDuration(time);
        this.setState(state);
        this.sample.played = time;

        this.setDroppedFrames(event);

        this.sendAnalyticsRequestAndClearValues();
      },

      playingAndBye: (time: number, state: string, event: any) => {
        this.setDuration(time);
        this.setState(state);
        this.sample.played = time;

        this.setDroppedFrames(event);

        this.sendUnloadRequest();
      },

      heartbeat: (time: number, state: string, event: any) => {
        this.setDroppedFrames(event);
        this.setState(state);
        this.setDuration(time);

        this.sample.played = this.sample.duration;

        this.sendAnalyticsRequestAndClearValues();
      },

      qualitychange: (time: number, state: string) => {
        this.setDuration(time);
        this.setState(state);

        this.sendAnalyticsRequestAndClearValues();
      },

      qualitychange_pause: (time: number, state: string) => {
        this.setDuration(time);
        this.setState(state);

        this.sendAnalyticsRequestAndClearValues();
      },

      qualitychange_rebuffering: (time: number, state: string) => {
        this.setDuration(time);
        this.setState(state);

        this.sendAnalyticsRequestAndClearValues();
      },

      videoChange: (event: any) => {
        this.stateMachineCallbacks.setVideoTimeEndFromEvent(event);
        this.stateMachineCallbacks.setVideoTimeStartFromEvent(event);
        this.setPlaybackVideoPropertiesFromEvent(event);
      },

      audioChange: (event: any) => {
        this.stateMachineCallbacks.setVideoTimeEndFromEvent(event);
        this.stateMachineCallbacks.setVideoTimeStartFromEvent(event);
        this.sample.audioBitrate = event.bitrate;
      },

      pause: (time: number, state: string, event: string) => {
        this.setDuration(time);
        this.setState(state);

        this.sample.paused = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      paused_seeking: (time: number, state: string, event: string) => {
        this.setDuration(time);
        this.setState(state);

        this.sample.seeked = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      play_seeking: Utils.noOp,

      end_play_seeking: (time: number, state: string, event: string) => {
        this.setState(state);
        this.setDuration(time);

        this.sample.seeked = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      rebuffering: (time: number, state: string, event: string) => {
        this.setDuration(time);
        this.setState(state);

        this.sample.buffered = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      error: (event: any) => {
        this.stateMachineCallbacks.setVideoTimeEndFromEvent(event);
        this.stateMachineCallbacks.setVideoTimeStartFromEvent(event);

        this.setState('error');
        this.sample.errorCode = event.code;
        this.sample.errorMessage = event.message;

        this.sendAnalyticsRequestAndClearValues();

        delete this.sample.errorCode;
        delete this.sample.errorMessage;
      },

      end: (time: number, state: string, event: string) => {
        this.generateNewImpressionId();
      },

      ad: (time: number, state: string, event: any) => {
        this.setDuration(time);
        this.setState(state);
        this.sample.ad = time;

        this.setDroppedFrames(event);

        this.sendAnalyticsRequestAndClearValues();
      },

      mute: () => {
        this.sample.isMuted = true;
      },

      unMute: () => {
        this.sample.isMuted = false;
      },

      muting_ready: Utils.noOp,
      muting_play: Utils.noOp,
      muting_pause: Utils.noOp,

      setVideoTimeEndFromEvent: (event: any) => {
        if (Utils.validNumber(event.currentTime)) {
          this.sample.videoTimeEnd = Utils.calculateTime(event.currentTime);
        }
      },

      setVideoTimeStartFromEvent: (event: any) => {
        if (Utils.validNumber(event.currentTime)) {
          this.sample.videoTimeStart = Utils.calculateTime(event.currentTime);
        }
      },

      source_changing: (time: number, state: string, event: any) => {
        this.setPlaybackInfoFromAdapter();
      },
    };
  }

  setCustomDataOnce = (values: any) => {
    const oldConfig = this.config;
    this.setCustomData(values);
    this.setCustomData(oldConfig);
  };

  guardAgainstMissingVideoTitle = (oldConfig: AnalyicsConfig, newConfig: AnalyicsConfig) => {
    
    if ((oldConfig && newConfig) && oldConfig.title && !newConfig.title) {
      // TODO: Better description
      logger.error("The new analytics configuration does not contain the field title");
    }
  }

  sourceChange = (config: AnalyicsConfig) => {
    logger.log('Processing Source Change for Analytics', config);
    if (this.sample.state) {
      this.sendAnalyticsRequestAndClearValues();
    }
    this.setupSample();
    this.startupTime = 0;
    this.init();

    this.guardAgainstMissingVideoTitle(this.config, config);

    const newConfig = {
      ...this.config,
      ...config,
    };
    this.setConfigParameters(this.sample, newConfig);

    this.analyticsStateMachine.sourceChange(newConfig, Utils.getCurrentTimestamp());
  };

  setCustomData = (values: any): any => {
    const filterValues = ({customData1, customData2, customData3, customData4, customData5, experimentName}: any) => {
      let retVal = {
        customData1,
        customData2,
        customData3,
        customData4,
        customData5,
        experimentName,
      };
      if (customData1) {
        retVal.customData1 = customData1;
      }
      if (customData2) {
        retVal.customData2 = customData2;
      }
      if (customData3) {
        retVal.customData3 = customData3;
      }
      if (customData4) {
        retVal.customData4 = customData4;
      }
      if (customData5) {
        retVal.customData5 = customData5;
      }
      if (experimentName) {
        retVal.experimentName = experimentName;
      }
      return retVal;
    };

    this.sendAnalyticsRequestAndClearValues();
    this.config = {
      ...this.config,
      ...filterValues(values),
    };
    this.setConfigParameters();
  };

  register = (player: any, opts?: AnalyticsStateMachineOptions) => {
    if (!opts) {
      opts = {
        starttime: undefined,
      };
    }
    if (!opts.starttime) {
      opts.starttime = Utils.getCurrentTimestamp();
    }
    this.analyticsStateMachine = AnalyticsStateMachineFactory.getAnalyticsStateMachine(
      player,
      this.stateMachineCallbacks,
      opts
    );

    try {
      this.adapter = AdapterFactory.getAdapter(player, this.record, this.analyticsStateMachine);
    } catch (e) {
      logger.error('Bitmovin Analytics: Could not detect player', e);
      return;
    }
    if (!this.sample.player) {
      this.sample.player = this.adapter.getPlayerName();
    }
    if (!this.sample.version) {
      this.sample.version = this.sample.player + '-' + this.adapter.getPlayerVersion();
    }
  };

  getCurrentImpressionId = (): string | undefined => {
    return this.sample.impressionId;
  };

  record = (eventType: string, eventObject: any) => {
    eventObject = eventObject || {};

    this.analyticsStateMachine.callEvent(eventType, eventObject, Utils.getCurrentTimestamp());
  };

  setDuration(duration: number) {
    this.sample.duration = duration;
  }

  setState(state: string) {
    this.sample.state = state;
  }

  setPlaybackVideoPropertiesFromEvent(event: any) {
    if (Utils.validNumber(event.width)) {
      this.sample.videoPlaybackWidth = event.width;
    }
    if (Utils.validNumber(event.height)) {
      this.sample.videoPlaybackHeight = event.height;
    }
    if (Utils.validNumber(event.bitrate)) {
      this.sample.videoBitrate = event.bitrate;
    }
  }

  setDroppedFrames = (event: any) => {
    if (Utils.validNumber(event.droppedFrames)) {
      this.sample.droppedFrames = 0;
    }
  };

  setPlaybackInfoFromAdapter() {
    const info = this.adapter.getCurrentPlaybackInfo()
    if (!info) {
      return;
    }
    if (Utils.validBoolean(info.isLive)) {
      this.sample.isLive = info.isLive;
    }
    if (Utils.validString(info.version)) {
      this.sample.version = this.sample.player + '-' + info.version;
    }
    if (Utils.validString(info.playerTech)) {
      this.sample.playerTech = info.playerTech;
    }
    if (Utils.validNumber(info.videoDuration)) {
      this.sample.videoDuration = Utils.calculateTime(info.videoDuration || 0);
    }
    if (Utils.validString(info.streamFormat)) {
      this.sample.streamFormat = info.streamFormat;
    }
    if (Utils.validString(info.mpdUrl)) {
      this.sample.mpdUrl = info.mpdUrl;
    }
    if (Utils.validString(info.m3u8Url)) {
      this.sample.m3u8Url = info.m3u8Url;
    }
    if (Utils.validString(info.progUrl)) {
      this.sample.progUrl = info.progUrl;
    }
    if (Utils.validNumber(info.videoWindowWidth)) {
      this.sample.videoWindowWidth = info.videoWindowWidth;
    }
    if (Utils.validNumber(info.videoWindowHeight)) {
      this.sample.videoWindowHeight = info.videoWindowHeight;
    }
    if (Utils.validBoolean(info.isMuted)) {
      this.sample.isMuted = info.isMuted;
    }
    if (Utils.validBoolean(info.autoplay)) {
      this.autoplay = info.autoplay;
    }
    if (Utils.validString(info.videoTitle) && !this.config.title) {
      this.sample.videoTitle = info.videoTitle;
    }
    if (this.sample.streamFormat === 'progressive') {
      this.sample.videoBitrate = info.progBitrate;
    }
  }

  setupSample() {
    this.sample = {
      domain: Utils.sanitizePath(window.location.hostname),
      path: Utils.sanitizePath(window.location.pathname),
      language: navigator.language || (navigator as any).userLanguage,
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      isLive: false,
      videoDuration: 0,
      size: 'WINDOW',
      time: 0,
      videoWindowWidth: 0,
      videoWindowHeight: 0,
      droppedFrames: 0,
      played: 0,
      buffered: 0,
      paused: 0,
      ad: 0,
      seeked: 0,
      videoPlaybackWidth: 0,
      videoPlaybackHeight: 0,
      videoBitrate: 0,
      audioBitrate: 0,
      videoTimeStart: 0,
      videoTimeEnd: 0,
      videoStartupTime: 0,
      duration: 0,
      startupTime: 0,
      version: this.sample.version,
      player: this.sample.player,
      analyticsVersion: VERSION,
    };
  }

  sendAnalyticsRequest() {
    this.sample.time = Utils.getCurrentTimestamp();
    const copySample = { ...this.sample };
    this.backend.sendRequest(copySample)
  }

  sendAnalyticsRequestAndClearValues() {
    this.sendAnalyticsRequest();
    this.clearValues();
  }

  sendUnloadRequest() {
      this.backend.sendUnloadRequest(this.sample);
  }

  sendAnalyticsRequestSynchronous() {
    this.backend.sendRequestSynchronous(this.sample);
  }

  clearValues() {
    this.sample.ad = 0;
    this.sample.paused = 0;
    this.sample.played = 0;
    this.sample.seeked = 0;
    this.sample.buffered = 0;

    this.sample.playerStartupTime = 0;
    this.sample.videoStartupTime = 0;
    this.sample.startupTime = 0;

    this.sample.duration = 0;
    this.sample.droppedFrames = 0;
    this.sample.pageLoadType = 0;

    this.sample.drmType = undefined;
    this.sample.drmLoadTime = undefined;
  }

  getDroppedFrames(frames: any) {
    if (frames != undefined && frames != 0) {
      const droppedFrames = frames - this.droppedSampleFrames;
      this.droppedSampleFrames = frames;
      return droppedFrames;
    } else {
      return 0;
    }
  }
}
