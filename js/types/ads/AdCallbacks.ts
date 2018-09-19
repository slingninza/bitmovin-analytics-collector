import { AdBreakEvent, AdClickedEvent, AdEvent, AdQuartileEvent, AdLinearityChangedEvent, ErrorEvent } from 'bitmovin-player';

export interface AdCallbacks {
  onAdBreakFinished: (event: AdBreakEvent) => void;
  onAdBreakStarted: (event: AdBreakEvent) => void;
  onAdClicked: (event: AdClickedEvent) => void;
  onAdError: (event: ErrorEvent) => void;
  onAdFinished: (event: AdEvent) => void;
  onAdLinearityChanged: (event: AdLinearityChangedEvent) => void;
  onAdManifestLoaded: (event: AdBreakEvent) => void;
  onAdQuartile: (event: AdQuartileEvent) => void;
  onAdSkipped: (event: AdEvent) => void;
  onAdStarted: (event: AdEvent) => void;
}
