import {Bitmovin7AnalyticsStateMachine} from '../js/analyticsStateMachines/Bitmovin7AnalyticsStateMachine';
import each from 'jest-each';
import * as statesFromFile from './seekingpausingmutingunmuting.json';

//@ts-ignore
const stateMachine = new Bitmovin7AnalyticsStateMachine();
let statesfromStateMachine=[];

//@ts-ignore
for(let i=0;i<statesFromFile.length;i++){
  stateMachine.callEvent(statesFromFile[i].event,statesFromFile[i].eventObject,statesFromFile[i].timestamp);
}

statesfromStateMachine=stateMachine.getStates();
statesfromStateMachine=JSON.parse(JSON.stringify(statesfromStateMachine));

for(let z=0;z<statesfromStateMachine.length;z++){
  //@ts-ignore
  each([[statesfromStateMachine[z],statesFromFile[z]]]).test('Test: '+statesFromFile[z].event +' From: '+ statesFromFile[z].from +' To: '+statesFromFile[z].to,(_statefromStateMachine,_stateFromFile) => 
  {

    expect(_statefromStateMachine.event).toMatch(_stateFromFile.event);
    expect(_stateFromFile.from).toMatch(_statefromStateMachine.from);
    expect(_stateFromFile.to).toMatch(_statefromStateMachine.to);},);
}
