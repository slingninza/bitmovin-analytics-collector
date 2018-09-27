import { AdBreakEvent, AdClickedEvent, AdEvent, AdQuartileEvent, AdLinearityChangedEvent, ErrorEvent } from 'bitmovin-player';
import { AdAdapter } from './AdAdapter';

export interface AdAnalyticsCallbacks {
    onPlay: (e: any) => void;
    onPause: (e: any) => void;
    setAdapter: (adapter: AdAdapter) => void;
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
    onBeforeUnload: () => void;
}