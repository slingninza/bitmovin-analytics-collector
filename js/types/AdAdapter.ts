import { AdEvent, AdBreakEvent, AdClickedEvent, AdQuartileEvent, ErrorEvent } from "bitmovin-player";

export interface AdAdapter {
  isLinearAdActive: () => boolean;
  getContainer: () => HTMLElement;
  getAdModule: () => string;
  currentTime: () => number;

  onAdStarted: (event: AdEvent) => void;
  onAdFinished: (event: AdEvent) => void;
  onAdBreakStarted: (event: AdBreakEvent) => void;
  onAdBreakFinished: (event: AdBreakEvent) => void;
  onAdClicked: (event: AdClickedEvent) => void;
  onAdError: (event: ErrorEvent) => void;
  onAdManifestLoaded: (event: AdBreakEvent) => void;
  onAdQuartile: (event: AdQuartileEvent) => void;
  onAdSkipped: (event: AdEvent) => void;
  onPlay: (issuer: string) => void;
  onPause: (issuer: string) => void;
  onBeforeUnload: () => void;
}