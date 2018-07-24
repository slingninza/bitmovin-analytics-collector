import {logger} from '../utils/Logger';
import {padRight} from '../utils/Logger';
import * as StateMachine from 'javascript-state-machine';
import {Event} from '../enums/Event';
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
  PLAY_SEEKING = 'PLAY_SEEKING',
  END_PLAY_SEEKING = 'END_PLAY_SEEKING',
  QUALITYCHANGE_PAUSE = 'QUALITYCHANGE_PAUSE',
  END = 'END',
  ERROR = 'ERROR',
  AD = 'AD',
  MUTING_READY = 'MUTING_READY',
  MUTING_PLAY = 'MUTING_PLAY',
  MUTING_PAUSE = 'MUTING_PAUSE',
}

export class BitmovinAnalyticsStateMachine implements AnalyticsStateMachine {
  static PAUSE_SEEK_DELAY = 60;
  static SEEKED_PAUSE_DELAY = 120;

  private States: any;
  private stateMachineCallbacks: StateMachineCallbacks;
  private pausedTimestamp: any;
  private seekTimestamp: number;
  private seekedTimestamp: number;
  private seekedTimeout: number;
  private onEnterStateTimestamp: number;
  private stateMachine: any;

  constructor(stateMachineCallbacks: StateMachineCallbacks) {
    this.stateMachineCallbacks = stateMachineCallbacks;

    this.pausedTimestamp = null;
    this.seekTimestamp = 0;
    this.seekedTimestamp = 0;
    this.seekedTimeout = 0;
    this.onEnterStateTimestamp = 0;

    this.States = States;

    this.createStateMachine();
  }

  createStateMachine() {
    this.stateMachine = StateMachine.create({
      initial: this.States.SETUP,
      error: (eventName, from, to, args, errorCode, errorMessage, originalException) => {
        logger.error(errorMessage);
      },
      events: [
        {name: Event.READY, from: [this.States.SETUP, this.States.ERROR], to: this.States.READY},
        {name: Event.PLAY, from: this.States.READY, to: this.States.STARTUP},

        {name: Event.START_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.END_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.TIMECHANGED, from: this.States.STARTUP, to: this.States.PLAYING},

        {name: Event.TIMECHANGED, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Event.END_BUFFERING, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Event.START_BUFFERING, from: this.States.PLAYING, to: this.States.REBUFFERING},
        {name: Event.END_BUFFERING, from: this.States.REBUFFERING, to: this.States.PLAYING},
        {name: Event.TIMECHANGED, from: this.States.REBUFFERING, to: this.States.REBUFFERING},

        {name: Event.PAUSE, from: this.States.PLAYING, to: this.States.PAUSE},
        {name: Event.PAUSE, from: this.States.REBUFFERING, to: this.States.PAUSE},
        {name: Event.PLAY, from: this.States.PAUSE, to: this.States.PLAYING},

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
        {name: Event.PLAY, from: this.States.PAUSED_SEEKING, to: this.States.PLAYING},
        {name: Event.PAUSE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},

        {name: 'PLAY_SEEK', from: this.States.PAUSE, to: this.States.PLAY_SEEKING},
        {name: 'PLAY_SEEK', from: this.States.PAUSED_SEEKING, to: this.States.PLAY_SEEKING},
        {name: 'PLAY_SEEK', from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.SEEK, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.AUDIO_CHANGE, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.VIDEO_CHANGE, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.START_BUFFERING, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.END_BUFFERING, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.SEEKED, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},

        // We are ending the seek
        {name: Event.PLAY, from: this.States.PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},

        {name: Event.START_BUFFERING, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Event.END_BUFFERING, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Event.SEEKED, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Event.TIMECHANGED, from: this.States.END_PLAY_SEEKING, to: this.States.PLAYING},

        {name: Event.END, from: this.States.PLAY_SEEKING, to: this.States.END},
        {name: Event.END, from: this.States.PAUSED_SEEKING, to: this.States.END},
        {name: Event.END, from: this.States.PLAYING, to: this.States.END},
        {name: Event.END, from: this.States.PAUSE, to: this.States.END},
        {name: Event.SEEK, from: this.States.END, to: this.States.END},
        {name: Event.SEEKED, from: this.States.END, to: this.States.END},
        {name: Event.TIMECHANGED, from: this.States.END, to: this.States.END},
        {name: Event.END_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Event.START_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Event.END, from: this.States.END, to: this.States.END},

        {name: Event.PLAY, from: this.States.END, to: this.States.PLAYING},

        {
          name: Event.ERROR,
          from: [
            this.States.SETUP,
            this.States.STARTUP,
            this.States.READY,
            this.States.PLAYING,
            this.States.REBUFFERING,
            this.States.PAUSE,
            this.States.QUALITYCHANGE,
            this.States.PAUSED_SEEKING,
            this.States.PLAY_SEEKING,
            this.States.END_PLAY_SEEKING,
            this.States.QUALITYCHANGE_PAUSE,
            'FINISH_PLAY_SEEKING',
            'PLAY_SEEK',
            'FINISH_QUALITYCHANGE_PAUSE',
            'FINISH_QUALITYCHANGE',
            this.States.END,
            this.States.ERROR,
          ],
          to: this.States.ERROR,
        },

        {name: Event.SEEK, from: this.States.END_PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: 'FINISH_PLAY_SEEKING', from: this.States.END_PLAY_SEEKING, to: this.States.PLAYING},

        {name: Event.UNLOAD, from: [this.States.PLAYING, this.States.PAUSE], to: this.States.END},

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
      ],
      callbacks: {
        onpause: (event, from, to, timestamp) => {
          if (from === this.States.PLAYING) {
            this.pausedTimestamp = timestamp;
          }
        },
        onbeforeevent: (event, from, to, timestamp, eventObject) => {
          if (event === Event.SEEK && from === this.States.PAUSE) {
            if (timestamp - this.pausedTimestamp < BitmovinAnalyticsStateMachine.PAUSE_SEEK_DELAY) {
              this.stateMachine.PLAY_SEEK(timestamp);
              return false;
            }
          }
          if (event === Event.SEEK) {
            window.clearTimeout(this.seekedTimeout);
          }

          if (event === Event.SEEKED && from === this.States.PAUSED_SEEKING) {
            this.seekedTimestamp = timestamp;
            this.seekedTimeout = window.setTimeout(() => {
              this.stateMachine.pause(timestamp, eventObject);
            }, BitmovinAnalyticsStateMachine.SEEKED_PAUSE_DELAY);
            return false;
          }
        },
        onafterevent: (event, from, to, timestamp) => {
          logger.log('[ENTER] ' + padRight(to, 20) + 'EVENT: ' + padRight(event, 20) + ' from ' + padRight(from, 14));
          if (to === this.States.QUALITYCHANGE_PAUSE) {
            this.stateMachine.FINISH_QUALITYCHANGE_PAUSE(timestamp);
          }
          if (to === this.States.QUALITYCHANGE) {
            this.stateMachine.FINISH_QUALITYCHANGE(timestamp);
          }
          if (to === this.States.MUTING_READY || to === this.States.MUTING_PLAY || to === this.States.MUTING_PAUSE) {
            this.stateMachine.FINISH_MUTING(timestamp);
          }
        },
        onenterstate: (event, from, to, timestamp, eventObject) => {
          this.onEnterStateTimestamp = timestamp || new Date().getTime();

          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
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
          if (from === this.States.END_PLAY_SEEKING || from === this.States.PAUSED_SEEKING) {
            const seekDuration = this.seekedTimestamp - this.seekTimestamp;
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
          this.seekTimestamp = timestamp;
        },
        onseeked: (event, from, to, timestamp) => {
          this.seekedTimestamp = timestamp;
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

  updateMetadata(metadata: any) {}
  sourceChange(config: any, timestamp: number) {}
}
