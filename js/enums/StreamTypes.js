import {MIMETypes} from './MIMETypes';

const { MP4, WEBM, HLS, DASH } = MIMETypes;

const mapping = {
  [MP4]: 'progressive',
  [WEBM]: 'progressive',
  [HLS]: 'hls',
  [DASH]: 'dash'
};

export function getStreamTypeFromMIMEType(mimeType) {
  const val = mapping[mimeType];
  return val;
}

