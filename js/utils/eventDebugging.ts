export class EventDebugging {
  event: string | undefined;
  from: string | undefined;
  to: string | undefined;
  timestamp: number;
  eventObject: any;

  constructor(
    event: string | undefined,
    from: string | undefined,
    to: string | undefined,
    timestamp: number,
    eventObject: any
  ) {
    this.event = event;
    this.from = from;
    this.to = to;
    this.timestamp = timestamp;
    this.eventObject = eventObject;
  }
}
