import {Bitmovin7AnalyticsStateMachine} from '../js/analyticsStateMachines/Bitmovin7AnalyticsStateMachine';
import each from 'jest-each';

//@ts-ignore
import * as statesFromFile from './seekingpausingmutingunmuting.json';

//@ts-ignore
const stateMachine = new Bitmovin7AnalyticsStateMachine();
stateMachine.setEnabledDebugging(true);
let statesfromStateMachine=[];

//@ts-ignore
for(let i=0;i<statesFromFile.length;i++){
  stateMachine.callEvent(statesFromFile[i].event,statesFromFile[i].eventObject,statesFromFile[i].timestamp);
}

statesfromStateMachine=stateMachine.getStates();
statesfromStateMachine=JSON.parse(JSON.stringify(statesfromStateMachine));

for(let z=0;z<statesfromStateMachine.length;z++){
  //@ts-ignore
  each([[statesfromStateMachine[z],statesFromFile[z]]]).test('Test: '+statesFromFile[z].event +' From: '+ statesFromFile[z].from +' To: '+statesFromFile[z].to,(statefromStateMachine,stateFromFile) => 
  {

    expect(statefromStateMachine.event).toEqual(stateFromFile.event);
    expect(statefromStateMachine.from).toEqual(stateFromFile.from);
    expect(statefromStateMachine.to).toEqual(stateFromFile.to);},);
}
