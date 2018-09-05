import {logger} from '../utils/Logger';
import {padRight} from '../utils/Logger';
import * as StateMachine from 'javascript-state-machine';
import {Event} from '../enums/Event';
import {AnalyticsStateMachineOptions} from '../types/AnalyticsStateMachineOptions';
import {EventDebugging} from '../utils/EventDebugging';
import {StateMachineCallbacks} from '../types/StateMachineCallbacks';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';

enum State {
  SETUP = 'SETUP',
  STARTUP = 'STARTUP',
  READY = 'READY',
  PLAYING = 'PLAYING',
  REBUFFERING = 'REBUFFERING',
  PAUSE = 'PAUSE',
  QUALITYCHANGE = 'QUALITYCHANGE',
  PAUSED_SEEKING = 'PAUSED_SEEKING',
  END_PAUSED_SEEKING = 'END_PAUSED_SEEKING',
  PLAY_SEEKING = 'PLAY_SEEKING',
  END_PLAY_SEEKING = 'END_PLAY_SEEKING',
  QUALITYCHANGE_PAUSE = 'QUALITYCHANGE_PAUSE',
  QUALITYCHANGE_REBUFFERING = 'QUALITYCHANGE_REBUFFERING',
  END = 'END',
  ERROR = 'ERROR',
  AD = 'AD',
  MUTING_READY = 'MUTING_READY',
  MUTING_PLAY = 'MUTING_PLAY',
  MUTING_PAUSE = 'MUTING_PAUSE',
  CASTING = 'CASTING',
  SOURCE_CHANGING = 'SOURCE_CHANGING',
  SOURCE_LOADED = 'SOURCE_LOADED',
}

export class Bitmovin8AnalyticsStateMachine implements AnalyticsStateMachine {
  private debuggingStates: EventDebugging[] = [];
  private enabledDebugging = false;

  private stateMachineCallbacks: StateMachineCallbacks;
  private seekTimestamp: number;
  private seekedTimestamp: number;
  private onEnterStateTimestamp: number;
  private stateMachine: any;

  constructor(stateMachineCallbacks: StateMachineCallbacks, opts: AnalyticsStateMachineOptions) {
    this.stateMachineCallbacks = stateMachineCallbacks;
    this.seekTimestamp = 0;
    this.seekedTimestamp = 0;
    this.onEnterStateTimestamp = 0;

    this.createStateMachine(opts);
  }

  getAllStates() {
    return Object.keys(State).map(key => State[key]);
  }

  sourceChange = (config: any, timestamp: number) => {
    this.callEvent(Event.MANUAL_SOURCE_CHANGE, config, timestamp);
  };

  createStateMachine(opts: AnalyticsStateMachineOptions) {
    this.stateMachine = StateMachine.create({
      initial: State.SETUP,
      error: (eventName, from, to, args, errorCode, errorMessage) => {
        logger.error('Error in statemachine: ' + errorMessage);
      },
      events: [
        {name: Event.SOURCE_LOADED, from: [State.SETUP, State.ERROR, State.SOURCE_CHANGING], to: State.READY},

        {name: Event.PLAY, from: State.READY, to: State.STARTUP},
        {name: Event.PLAYING, from: State.READY, to: State.PLAYING},
        {name: Event.READY, from: State.READY, to: State.READY},
        {name: Event.VIDEO_CHANGE, from: State.READY, to: State.READY},
        {name: Event.AUDIO_CHANGE, from: State.READY, to: State.READY},

        {name: Event.PLAYING, from: State.STARTUP, to: State.PLAYING},
        {name: Event.START_BUFFERING, from: State.STARTUP, to: State.STARTUP},
        {name: Event.END_BUFFERING, from: State.STARTUP, to: State.STARTUP},
        {name: Event.VIDEO_CHANGE, from: State.STARTUP, to: State.STARTUP},
        {name: Event.AUDIO_CHANGE, from: State.STARTUP, to: State.STARTUP},
        {name: Event.READY, from: State.STARTUP, to: State.STARTUP},

        {name: Event.PLAYING, from: State.PLAYING, to: State.PLAYING},
        {name: Event.TIMECHANGED, from: State.PLAYING, to: State.PLAYING},
        {name: Event.END_BUFFERING, from: State.PLAYING, to: State.PLAYING},
        {name: Event.START_BUFFERING, from: State.PLAYING, to: State.REBUFFERING},
        {name: Event.END_BUFFERING, from: State.REBUFFERING, to: State.PLAYING},
        {name: Event.TIMECHANGED, from: State.REBUFFERING, to: State.REBUFFERING},

        {name: Event.PAUSE, from: State.PLAYING, to: State.PAUSE},
        {name: Event.PAUSE, from: State.REBUFFERING, to: State.PAUSE},
        {name: Event.PLAY, from: State.PAUSE, to: State.PLAYING},

        {name: Event.VIDEO_CHANGE, from: State.PLAYING, to: State.QUALITYCHANGE},
        {name: Event.AUDIO_CHANGE, from: State.PLAYING, to: State.QUALITYCHANGE},
        {name: Event.VIDEO_CHANGE, from: State.QUALITYCHANGE, to: State.QUALITYCHANGE},
        {name: Event.AUDIO_CHANGE, from: State.QUALITYCHANGE, to: State.QUALITYCHANGE},
        {name: 'FINISH_QUALITYCHANGE', from: State.QUALITYCHANGE, to: State.PLAYING},

        {name: Event.VIDEO_CHANGE, from: State.PAUSE, to: State.QUALITYCHANGE_PAUSE},
        {name: Event.AUDIO_CHANGE, from: State.PAUSE, to: State.QUALITYCHANGE_PAUSE},
        {
          name: Event.VIDEO_CHANGE,
          from: State.QUALITYCHANGE_PAUSE,
          to: State.QUALITYCHANGE_PAUSE,
        },
        {
          name: Event.AUDIO_CHANGE,
          from: State.QUALITYCHANGE_PAUSE,
          to: State.QUALITYCHANGE_PAUSE,
        },
        {name: 'FINISH_QUALITYCHANGE_PAUSE', from: State.QUALITYCHANGE_PAUSE, to: State.PAUSE},

        {name: Event.SEEK, from: State.PAUSE, to: State.PAUSED_SEEKING},
        {name: Event.SEEK, from: State.PAUSED_SEEKING, to: State.PAUSED_SEEKING},
        {name: Event.SEEKED, from: State.PAUSED_SEEKING, to: State.PAUSE},
        {name: Event.PLAY, from: State.PAUSED_SEEKING, to: State.END_PAUSED_SEEKING},
        {name: Event.PLAYING, from: State.END_PAUSED_SEEKING, to: State.END_PAUSED_SEEKING},
        {name: Event.TIMECHANGED, from: State.END_PAUSED_SEEKING, to: State.END_PAUSED_SEEKING},
        {name: Event.SEEKED, from: State.END_PAUSED_SEEKING, to: State.PLAYING},
        {name: Event.AUDIO_CHANGE, from: State.PAUSED_SEEKING, to: State.PAUSED_SEEKING},
        {name: Event.VIDEO_CHANGE, from: State.PAUSED_SEEKING, to: State.PAUSED_SEEKING},
        {name: Event.START_BUFFERING, from: State.PAUSED_SEEKING, to: State.PAUSED_SEEKING},
        {name: Event.END_BUFFERING, from: State.PAUSED_SEEKING, to: State.PAUSED_SEEKING},

        {name: Event.SEEK, from: State.PLAYING, to: State.PLAY_SEEKING},
        {name: Event.SEEK, from: State.PLAY_SEEKING, to: State.PLAY_SEEKING},
        {name: Event.AUDIO_CHANGE, from: State.PLAY_SEEKING, to: State.PLAY_SEEKING},
        {name: Event.VIDEO_CHANGE, from: State.PLAY_SEEKING, to: State.PLAY_SEEKING},
        {name: Event.START_BUFFERING, from: State.PLAY_SEEKING, to: State.PLAY_SEEKING},
        {name: Event.END_BUFFERING, from: State.PLAY_SEEKING, to: State.PLAY_SEEKING},

        {name: Event.PLAY, from: State.PLAY_SEEKING, to: State.END_PLAY_SEEKING},
        {name: Event.PLAYING, from: State.PLAY_SEEKING, to: State.END_PLAY_SEEKING},
        {name: Event.SEEKED, from: State.PLAY_SEEKING, to: State.END_PLAY_SEEKING},

        {name: Event.SEEK, from: State.END_PLAY_SEEKING, to: State.PLAY_SEEKING},

        
        {name: Event.START_BUFFERING, from: State.END_PLAY_SEEKING, to: State.END_PLAY_SEEKING},
        {name: Event.END_BUFFERING, from: State.END_PLAY_SEEKING, to: State.END_PLAY_SEEKING},
        {name: Event.SEEKED, from: State.END_PLAY_SEEKING, to: State.END_PLAY_SEEKING},
        {name: Event.PLAY, from: State.END_PLAY_SEEKING, to: State.END_PLAY_SEEKING},
        {name: Event.PLAYING, from: State.END_PLAY_SEEKING, to: State.PLAYING},
        {name: Event.TIMECHANGED, from: State.END_PLAY_SEEKING, to: State.PLAYING},

        {name: Event.END, from: State.PLAY_SEEKING, to: State.END},
        {name: Event.END, from: State.PAUSED_SEEKING, to: State.END},
        {name: Event.END, from: State.PLAYING, to: State.END},
        {name: Event.END, from: State.PAUSE, to: State.END},
        {name: Event.SEEK, from: State.END, to: State.END},
        {name: Event.SEEKED, from: State.END, to: State.END},
        {name: Event.TIMECHANGED, from: State.END, to: State.END},
        {name: Event.END_BUFFERING, from: State.END, to: State.END},
        {name: Event.START_BUFFERING, from: State.END, to: State.END},
        {name: Event.END, from: State.END, to: State.END},

        {name: Event.PLAY, from: State.END, to: State.PLAYING},

        {name: Event.ERROR, from: this.getAllStates(), to: State.ERROR},

        {name: Event.UNLOAD, from: this.getAllStates(), to: State.END},

        {name: Event.START_AD, from: State.PLAYING, to: State.AD},
        {name: Event.END_AD, from: State.AD, to: State.PLAYING},

        {name: Event.MUTE, from: State.READY, to: State.MUTING_READY},
        {name: Event.UN_MUTE, from: State.READY, to: State.MUTING_READY},
        {name: 'FINISH_MUTING', from: State.MUTING_READY, to: State.READY},

        {name: Event.MUTE, from: State.PLAYING, to: State.MUTING_PLAY},
        {name: Event.UN_MUTE, from: State.PLAYING, to: State.MUTING_PLAY},
        {name: 'FINISH_MUTING', from: State.MUTING_PLAY, to: State.PLAYING},

        {name: Event.MUTE, from: State.PAUSE, to: State.MUTING_PAUSE},
        {name: Event.UN_MUTE, from: State.PAUSE, to: State.MUTING_PAUSE},
        {name: 'FINISH_MUTING', from: State.MUTING_PAUSE, to: State.PAUSE},

        {name: Event.START_CAST, from: [State.READY, State.PAUSE], to: State.CASTING},
        {name: Event.PAUSE, from: State.CASTING, to: State.CASTING},
        {name: Event.PLAY, from: State.CASTING, to: State.CASTING},
        {name: Event.TIMECHANGED, from: State.CASTING, to: State.CASTING},
        {name: Event.MUTE, from: State.CASTING, to: State.CASTING},
        {name: Event.SEEK, from: State.CASTING, to: State.CASTING},
        {name: Event.SEEKED, from: State.CASTING, to: State.CASTING},
        {name: Event.END_CAST, from: State.CASTING, to: State.READY},

        {name: Event.SEEK, from: State.READY, to: State.READY},
        {name: Event.SEEKED, from: State.READY, to: State.READY},
        {name: Event.SEEKED, from: State.STARTUP, to: State.STARTUP},

        {name: Event.MANUAL_SOURCE_CHANGE, from: this.getAllStates(), to: State.SOURCE_CHANGING},
        {name: Event.SOURCE_UNLOADED, from: this.getAllStates(), to: State.SOURCE_CHANGING},

        //{name: Event.READY, from: State.SOURCE_CHANGING, to: State.READY},

        {name: Event.VIDEO_CHANGE, from: State.REBUFFERING, to: State.QUALITYCHANGE_REBUFFERING},
        {name: Event.AUDIO_CHANGE, from: State.REBUFFERING, to: State.QUALITYCHANGE_REBUFFERING},
        {
          name: Event.VIDEO_CHANGE,
          from: State.QUALITYCHANGE_REBUFFERING,
          to: State.QUALITYCHANGE_REBUFFERING,
        },
        {
          name: Event.AUDIO_CHANGE,
          from: State.QUALITYCHANGE_REBUFFERING,
          to: State.QUALITYCHANGE_REBUFFERING,
        },
        {
          name: 'FINISH_QUALITYCHANGE_REBUFFERING',
          from: State.QUALITYCHANGE_REBUFFERING,
          to: State.REBUFFERING,
        },
      ],
      callbacks: {
        onbeforeevent: (event, from, to, timestamp, eventObject) => {
          if (from === State.REBUFFERING && to === State.QUALITYCHANGE_REBUFFERING) {
            return false;
          }
        },
        onafterevent: (event, from, to, timestamp) => {
          if (to === State.QUALITYCHANGE_PAUSE) {
            this.stateMachine.FINISH_QUALITYCHANGE_PAUSE(timestamp);
          }
          if (to === State.QUALITYCHANGE) {
            this.stateMachine.FINISH_QUALITYCHANGE(timestamp);
          }
          if (to === State.QUALITYCHANGE_REBUFFERING) {
            this.stateMachine.FINISH_QUALITYCHANGE_REBUFFERING(timestamp);
          }
          if (to === State.MUTING_READY || to === State.MUTING_PLAY || to === State.MUTING_PAUSE) {
            this.stateMachine.FINISH_MUTING(timestamp);
          }
        },
        onenterstate: (
          event: string | undefined,
          from: string | undefined,
          to: string | undefined,
          timestamp: number,
          eventObject: any
        ) => {
          if (from === 'none' && opts.starttime) {
            this.onEnterStateTimestamp = opts.starttime;
          } else {
            this.onEnterStateTimestamp = timestamp || new Date().getTime();
          }

          logger.log('[ENTER ' + timestamp +'] ' + padRight(to, 20) + 'EVENT: ' + padRight(event, 20) + ' from ' + padRight(from, 20));
          if (
            eventObject &&
            to !== State.END_PAUSED_SEEKING &&
            to !== State.END_PLAY_SEEKING
          ) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (event === Event.START_CAST && to === State.CASTING) {
            this.stateMachineCallbacks.startCasting(timestamp, eventObject);
          }
        },
        onleavestate: (event, from, to, timestamp, eventObject) => {
          if (!timestamp) {
            return;
          }
          
          logger.log('[LEAVE '+timestamp+'] ' + padRight(from, 20) + 'EVENT: ' + padRight(event, 20) + ' to ' + padRight(to, 20));
          
          this.addStatesToLog(event, from, to, timestamp, eventObject);
          const stateDuration = timestamp - this.onEnterStateTimestamp;

          if(from === State.PAUSED_SEEKING && to === State.END_PAUSED_SEEKING) {
            return true;
          }

          if (
            eventObject &&
            to !== State.END_PAUSED_SEEKING &&
            to !== State.END_PLAY_SEEKING
          ) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);
          }

          const fnName = String(from).toLowerCase();
          if (from === State.PAUSED_SEEKING || from === State.END_PAUSED_SEEKING) {
            const seekDuration = timestamp - this.seekTimestamp;
            this.stateMachineCallbacks.paused_seeking(seekDuration, fnName, eventObject);
          }
          else if(from === State.END_PLAY_SEEKING) {
            const seekDuration = this.seekedTimestamp - this.seekTimestamp;
            this.stateMachineCallbacks.end_play_seeking(seekDuration, fnName, eventObject);
          } 
          else if (event === Event.UNLOAD && from === State.PLAYING) {
            this.stateMachineCallbacks.playingAndBye(stateDuration, fnName, eventObject);
          }
          else {
            const callbackFunction = this.stateMachineCallbacks[fnName];
            if (typeof callbackFunction === 'function') {
              callbackFunction(stateDuration, fnName, eventObject);
            } else {
              logger.error('Could not find callback function for ' + fnName);
            }
          }

          if (
            eventObject &&
            to !== State.END_PAUSED_SEEKING &&
            to !== State.END_PLAY_SEEKING
          ) {
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

  addStatesToLog(
    event: string | undefined,
    from: string | undefined,
    to: string | undefined,
    timestamp: number,
    eventObject: any
  ) {
    if (this.enabledDebugging) {
      this.debuggingStates.push(new EventDebugging(event, from, to, timestamp, eventObject));
    }
  }

  getStates() {
    return this.debuggingStates;
  }

  setEnabledDebugging(enabled: boolean) {
    this.enabledDebugging = enabled;
  }

  updateMetadata(metadata: any) {}
}
