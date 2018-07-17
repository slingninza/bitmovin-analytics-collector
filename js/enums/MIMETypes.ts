const MP4 = 'video/mp4';
const WEBM = 'video/webm';
const HLS = 'application/x-mpegURL';
const DASH = 'application/dash+xml';

export const MIMETypes = {
  MP4,
  WEBM,
  HLS,
  DASH
};

export function getMIMETypeFromFileExtension(path: string) {
  path = path.toLowerCase();

  if (path.endsWith('.m3u8')) {
    return HLS;
  }
  if (path.endsWith('.mp4') || path.endsWith('.m4v') || path.endsWith('.m4a')) {
    return MP4;
  }
  if (path.endsWith('.webm')) {
    return WEBM;
  }
  if (path.endsWith('.mpd')) {
    return DASH;
  }
  return null;
}
