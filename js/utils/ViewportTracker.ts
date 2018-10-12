import * as Utils from "./Utils";

export class ViewportTracker {

    private onIntersectionChanged: () => void;
    private observer: IntersectionObserver;
    private element: HTMLElement;
    private inViewport?: boolean = undefined;
    private threshold: number;
    private hidden: string | null;
    private visibilityChange?: string;

    constructor(element: HTMLElement, onIntersectionChanged: () => void, threshold: number = 1.0) {
        this.threshold = threshold;
        this.onIntersectionChanged = onIntersectionChanged;
        this.element = element;

        var options: IntersectionObserverInit = {
            root: null,
            rootMargin: "0px",
            threshold
        };
        this.observer = new IntersectionObserver((entries, observer) => this.handleIntersect(entries, observer), options);
        this.observer.observe(element);

        this.hidden = Utils.getHiddenProp();
        if(this.hidden) {
            this.visibilityChange = this.hidden.replace('hidden', '') + 'visibilitychange';
            document.addEventListener(this.visibilityChange, this.handleVisibilityChange = this.handleVisibilityChange.bind(this), false);
        }
    }

    public isHidden() {
        return this.hidden && document[this.hidden];
    }

    isInViewport(): boolean {
        return !this.isHidden() && (this.inViewport || true);
    }

    dispose() {
        this.observer.unobserve(this.element);
        this.observer.disconnect();
        if(this.visibilityChange) {
            document.removeEventListener(this.visibilityChange, this.handleVisibilityChange, false);
        }
    }

    private handleVisibilityChange() {
        this.onIntersectionChanged();
    }

    private handleIntersect(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
        entries.forEach(i => {
            if(i.target === this.element) {
                this.inViewport = !(i.intersectionRatio < this.threshold);
            }
        });
        this.onIntersectionChanged();
    }
}