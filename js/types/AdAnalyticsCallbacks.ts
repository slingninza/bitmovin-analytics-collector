export interface AdAnalyticsCallbacks {
    onPlay: (e: any) => void;
    onPause: (e: any) => void;
    setContainer: (container: HTMLElement) => void;
}