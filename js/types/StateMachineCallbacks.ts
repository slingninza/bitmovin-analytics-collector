export interface StateMachineCallbacks {
  [key: string]: any;
  setVideoTimeStartFromEvent: Function;
  startCasting: Function;
  setVideoTimeEndFromEvent: Function;
  heartbeat: Function;
  error: Function;
  videoChange: Function;
  audioChange: Function;
  mute: Function;
  unMute: Function;
  playingAndBye: Function;
  pause: Function;
}
