import AnalyticsStateMachineOptions from './AnalyticsStateMachineOptions';

export interface AnalyticsStateMachine {
  createStateMachine: (opts: AnalyticsStateMachineOptions) => void;
  callEvent: (eventType: string, eventObject: any, timestamp: number) => void;
}
