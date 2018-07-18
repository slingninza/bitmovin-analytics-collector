export default class eventDebugging {
  event: any;
  from: any;
  to: any;
  timestamp: number;
  eventObject: any;
  constructor(event: any, from: any, to: any, timestamp: number, eventObject: any) {
    this.event = event;
    this.from = from;
    this.to = to;
    this.timestamp = timestamp;
    this.eventObject = eventObject;
  }
}
