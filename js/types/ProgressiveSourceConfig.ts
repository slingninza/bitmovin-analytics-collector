export interface ProgressiveSourceObject {
    url: string,
    bitrate?: number
}

export type ProgressiveSourceConfig = ProgressiveSourceObject | ProgressiveSourceObject[] | string | undefined;