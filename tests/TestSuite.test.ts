import {Bitmovin7AnalyticsStateMachine} from '../js/analyticsStateMachines/Bitmovin7AnalyticsStateMachine';
import each from 'jest-each';
import * as statesFromFile from './normal.json';

const stateMachine = new Bitmovin7AnalyticsStateMachine(null, null);
stateMachine.setEnabledDebugging(true);
let statesfromStateMachine = [];

for (let i = 0; i < statesFromFile.length; i++) {
  var state = statesFromFile[i];
  stateMachine.callEvent(state.event, state.eventObject, state.timestamp);
}

statesfromStateMachine = stateMachine.getStates();
statesfromStateMachine = JSON.parse(JSON.stringify(statesfromStateMachine));

for (let z = 0; z < statesfromStateMachine.length; z++) {
  each([[statesfromStateMachine[z], statesFromFile[z]]]).test(
    'Test: ' + statesFromFile[z].event + ' From: ' + statesFromFile[z].from + ' To: ' + statesFromFile[z].to,
    (statefromStateMachine, stateFromFile) => {
      expect(statefromStateMachine.event).toEqual(stateFromFile.event);
      expect(statefromStateMachine.from).toEqual(stateFromFile.from);
      expect(statefromStateMachine.to).toEqual(stateFromFile.to);
    }
  );
}
