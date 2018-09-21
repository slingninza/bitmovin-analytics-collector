import {logger} from '../utils/Logger';
import {padRight} from '../utils/Logger';
import * as StateMachine from 'javascript-state-machine';
import {Event} from '../enums/Event';
import {AnalyticsStateMachineOptions} from '../types/AnalyticsStateMachineOptions';
import {StateMachineCallbacks} from '../types/StateMachineCallbacks';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';

enum States {
  SETUP = 'SETUP',
  STARTUP = 'STARTUP',
  READY = 'READY',
  PLAYING = 'PLAYING',
  REBUFFERING = 'REBUFFERING',
  PAUSE = 'PAUSE',
  QUALITYCHANGE = 'QUALITYCHANGE',
  PAUSED_SEEKING = 'PAUSED_SEEKING',
  QUALITYCHANGE_PAUSE = 'QUALITYCHANGE_PAUSE',
  QUALITYCHANGE_REBUFFERING = 'QUALITYCHANGE_REBUFFERING',
  END = 'END',
  ERROR = 'ERROR',
  MUTING_READY = 'MUTING_READY',
  MUTING_PLAY = 'MUTING_PLAY',
  MUTING_PAUSE = 'MUTING_PAUSE',
  CASTING = 'CASTING',
}

export class HTML5AnalyticsStateMachine implements AnalyticsStateMachine {
  private States: any;
  private stateMachineCallbacks: StateMachineCallbacks;
  private onEnterStateTimestamp: number;
  private seekStartedAt: any;
  private stateMachine: any;

  constructor(stateMachineCallbacks: StateMachineCallbacks, opts: AnalyticsStateMachineOptions) {
    this.stateMachineCallbacks = stateMachineCallbacks;

    this.onEnterStateTimestamp = 0;
    this.seekStartedAt = null;

    this.States = States;

    this.createStateMachine(opts);
  }

  getAllStates() {
    return [
      ...Object.keys(this.States).map(key => this.States[key]),
      'FINISH_QUALITYCHANGE_PAUSE',
      'FINISH_QUALITYCHANGE',
      'FINISH_QUALITYCHANGE_REBUFFERING',
    ];
  }

  createStateMachine(opts: AnalyticsStateMachineOptions) {
    this.stateMachine = StateMachine.create({
      initial: this.States.SETUP,
      error: (eventName, from, to, args, errorCode, errorMessage) => {
        logger.error('Error in statemachine: ' + errorMessage);
      },
      events: [
        {name: Event.TIMECHANGED, from: this.States.SETUP, to: this.States.SETUP},
        {name: Event.READY, from: [this.States.SETUP, this.States.ERROR], to: this.States.READY},

        {name: Event.PLAY, from: this.States.READY, to: this.States.STARTUP},

        {name: Event.START_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.END_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.VIDEO_CHANGE, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.AUDIO_CHANGE, from: this.States.STARTUP, to: this.States.STARTUP},

        {name: Event.TIMECHANGED, from: this.States.STARTUP, to: this.States.PLAYING},
        {name: Event.TIMECHANGED, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Event.TIMECHANGED, from: this.States.PAUSE, to: this.States.PAUSE},
        {name: Event.TIMECHANGED, from: this.States.PAUSE, to: this.States.PAUSE},

        {name: Event.SEEKED, from: this.States.PAUSE, to: this.States.PAUSE},

        {name: Event.END_BUFFERING, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Event.START_BUFFERING, from: this.States.PLAYING, to: this.States.REBUFFERING},
        {name: Event.START_BUFFERING, from: this.States.REBUFFERING, to: this.States.REBUFFERING},

        {name: Event.PLAY, from: this.States.REBUFFERING, to: this.States.PLAYING},
        {name: Event.TIMECHANGED, from: this.States.REBUFFERING, to: this.States.PLAYING},

        // Ignoring since it's pushed in a live stream
        {name: Event.SEEK, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.PLAY, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},

        {name: Event.PAUSE, from: this.States.PLAYING, to: this.States.PAUSE},
        {name: Event.PAUSE, from: this.States.REBUFFERING, to: this.States.PAUSE},

        {name: Event.PLAY, from: this.States.PAUSE, to: this.States.PLAYING},
        {name: Event.TIMECHANGED, from: this.States.PAUSE, to: this.States.PLAYING},

        {name: Event.VIDEO_CHANGE, from: this.States.PLAYING, to: this.States.QUALITYCHANGE},
        {name: Event.AUDIO_CHANGE, from: this.States.PLAYING, to: this.States.QUALITYCHANGE},
        {name: Event.VIDEO_CHANGE, from: this.States.QUALITYCHANGE, to: this.States.QUALITYCHANGE},
        {name: Event.AUDIO_CHANGE, from: this.States.QUALITYCHANGE, to: this.States.QUALITYCHANGE},
        {name: 'FINISH_QUALITYCHANGE', from: this.States.QUALITYCHANGE, to: this.States.PLAYING},

        {name: Event.VIDEO_CHANGE, from: this.States.PAUSE, to: this.States.QUALITYCHANGE_PAUSE},
        {name: Event.AUDIO_CHANGE, from: this.States.PAUSE, to: this.States.QUALITYCHANGE_PAUSE},
        {
          name: Event.VIDEO_CHANGE,
          from: this.States.QUALITYCHANGE_PAUSE,
          to: this.States.QUALITYCHANGE_PAUSE,
        },
        {
          name: Event.AUDIO_CHANGE,
          from: this.States.QUALITYCHANGE_PAUSE,
          to: this.States.QUALITYCHANGE_PAUSE,
        },
        {name: 'FINISH_QUALITYCHANGE_PAUSE', from: this.States.QUALITYCHANGE_PAUSE, to: this.States.PAUSE},

        {name: Event.SEEK, from: this.States.PAUSE, to: this.States.PAUSED_SEEKING},
        {name: Event.SEEK, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.AUDIO_CHANGE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.VIDEO_CHANGE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.START_BUFFERING, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.END_BUFFERING, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.SEEKED, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},
        {name: Event.TIMECHANGED, from: this.States.PAUSED_SEEKING, to: this.States.PLAYING},
        {name: Event.PAUSE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},

        {name: Event.END, from: this.States.PAUSED_SEEKING, to: this.States.END},
        {name: Event.END, from: this.States.PLAYING, to: this.States.END},
        {name: Event.END, from: this.States.PAUSE, to: this.States.END},
        {name: Event.SEEK, from: this.States.END, to: this.States.END},
        {name: Event.SEEKED, from: this.States.END, to: this.States.END},
        {name: Event.TIMECHANGED, from: this.States.END, to: this.States.END},
        {name: Event.END_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Event.START_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Event.END, from: this.States.END, to: this.States.END},

        //Ignored - Livestreams do a Seek during startup and SEEKED once playback started
        {name: Event.SEEKED, from: this.States.PLAYING, to: this.States.PLAYING},

        {name: Event.PLAY, from: this.States.END, to: this.States.PLAYING},

        {name: Event.ERROR, from: this.getAllStates(), to: this.States.ERROR},
        {name: Event.PAUSE, from: this.States.ERROR, to: this.States.ERROR},

        {name: Event.UNLOAD, from: this.getAllStates(), to: this.States.END},

        {name: Event.START_AD, from: this.States.PLAYING, to: this.States.AD},
        {name: Event.END_AD, from: this.States.AD, to: this.States.PLAYING},

        {name: Event.MUTE, from: this.States.READY, to: this.States.MUTING_READY},
        {name: Event.UN_MUTE, from: this.States.READY, to: this.States.MUTING_READY},
        {name: 'FINISH_MUTING', from: this.States.MUTING_READY, to: this.States.READY},

        {name: Event.MUTE, from: this.States.PLAYING, to: this.States.MUTING_PLAY},
        {name: Event.UN_MUTE, from: this.States.PLAYING, to: this.States.MUTING_PLAY},
        {name: 'FINISH_MUTING', from: this.States.MUTING_PLAY, to: this.States.PLAYING},

        {name: Event.MUTE, from: this.States.PAUSE, to: this.States.MUTING_PAUSE},
        {name: Event.UN_MUTE, from: this.States.PAUSE, to: this.States.MUTING_PAUSE},
        {name: 'FINISH_MUTING', from: this.States.MUTING_PAUSE, to: this.States.PAUSE},

        {name: Event.START_CAST, from: [this.States.READY, this.States.PAUSE], to: this.States.CASTING},
        {name: Event.PAUSE, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.PLAY, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.TIMECHANGED, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.MUTE, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.SEEK, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.SEEKED, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.END_CAST, from: this.States.CASTING, to: this.States.READY},

        {name: Event.SEEK, from: this.States.READY, to: this.States.READY},
        {name: Event.SEEKED, from: this.States.READY, to: this.States.READY},
        {name: Event.SEEKED, from: this.States.STARTUP, to: this.States.STARTUP},

        {name: Event.SOURCE_LOADED, from: this.getAllStates(), to: this.States.SETUP},

        {name: Event.VIDEO_CHANGE, from: this.States.REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {name: Event.AUDIO_CHANGE, from: this.States.REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {
          name: Event.VIDEO_CHANGE,
          from: this.States.QUALITYCHANGE_REBUFFERING,
          to: this.States.QUALITYCHANGE_REBUFFERING,
        },
        {
          name: Event.AUDIO_CHANGE,
          from: this.States.QUALITYCHANGE_REBUFFERING,
          to: this.States.QUALITYCHANGE_REBUFFERING,
        },
        {
          name: 'FINISH_QUALITYCHANGE_REBUFFERING',
          from: this.States.QUALITYCHANGE_REBUFFERING,
          to: this.States.REBUFFERING,
        },
      ],
      callbacks: {
        onenterstate: (event, from, to, timestamp, eventObject) => {
          if (from === 'none' && opts.starttime) {
            this.onEnterStateTimestamp = opts.starttime;
          } else {
            this.onEnterStateTimestamp = timestamp || new Date().getTime();
          }

          logger.log('[ENTER] ' + padRight(to, 20) + 'EVENT: ' + padRight(event, 20) + ' from ' + padRight(from, 14));
          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (event === Event.START_CAST && to === this.States.CASTING) {
            this.stateMachineCallbacks.startCasting(timestamp, eventObject);
          }
        },
        onafterevent: (event, from, to, timestamp) => {
          if (to === this.States.QUALITYCHANGE) {
            this.stateMachine.FINISH_QUALITYCHANGE(timestamp);
          }
          if (to === this.States.MUTING_READY || to === this.States.MUTING_PLAY || to === this.States.MUTING_PAUSE) {
            this.stateMachine.FINISH_MUTING(timestamp);
          }
        },
        onleavestate: (event, from, to, timestamp, eventObject) => {
          if (!timestamp) {
            return;
          }

          const stateDuration = timestamp - this.onEnterStateTimestamp;

          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);
          }

          const fnName = String(from).toLowerCase();
          if (from === this.States.PAUSED_SEEKING) {
            const seekDuration = timestamp - this.seekStartedAt;
            this.seekStartedAt = null;
            this.stateMachineCallbacks[fnName](seekDuration, fnName, eventObject);
          } else if (event === Event.UNLOAD && from === this.States.PLAYING) {
            this.stateMachineCallbacks.playingAndBye(stateDuration, fnName, eventObject);
          } else if (from === this.States.PAUSE && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(event);
            this.stateMachineCallbacks.pause(stateDuration, fnName, eventObject);
          } else {
            const callbackFunction = this.stateMachineCallbacks[fnName];
            if (typeof callbackFunction === 'function') {
              callbackFunction(stateDuration, fnName, eventObject);
            } else {
              logger.error('Could not find callback function for ' + fnName);
            }
          }

          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (event === Event.VIDEO_CHANGE) {
            this.stateMachineCallbacks.videoChange(eventObject);
          } else if (event === Event.AUDIO_CHANGE) {
            this.stateMachineCallbacks.audioChange(eventObject);
          } else if (event === Event.MUTE) {
            this.stateMachineCallbacks.mute();
          } else if (event === Event.UN_MUTE) {
            this.stateMachineCallbacks.unMute();
          }
        },
        onseek: (event, from, to, timestamp) => {
          this.seekStartedAt = this.seekStartedAt || timestamp;
        },
        ontimechanged: (event, from, to, timestamp, eventObject) => {
          const stateDuration = timestamp - this.onEnterStateTimestamp;

          if (stateDuration > 59700) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);

            this.stateMachineCallbacks.heartbeat(stateDuration, String(from).toLowerCase(), eventObject);
            this.onEnterStateTimestamp = timestamp;

            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }
        },
        onplayerError: (event, from, to, timestamp, eventObject) => {
          this.stateMachineCallbacks.error(eventObject);
        },
      },
    });
  }

  callEvent(eventType: string, eventObject: any, timestamp: number) {
    const exec = this.stateMachine[eventType];

    if (exec) {
      exec.call(this.stateMachine, timestamp, eventObject);
    } else {
      logger.log('Ignored Event: ' + eventType);
    }
  }

  updateMetadata(metadata: any) {
    this.stateMachineCallbacks.updateSample();
  }
  sourceChange(config: any, timestamp: number) {}
}
