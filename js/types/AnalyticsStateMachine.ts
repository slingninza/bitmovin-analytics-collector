import AnalyticsStateMachineOptions from '../core/AnalyticsStateMachineOptions';

export interface AnalyticsStateMachine {
  createStateMachine: (opts: AnalyticsStateMachineOptions) => void;
  callEvent: (eventType: string, eventObject: any, timestamp: number) => void;
}
