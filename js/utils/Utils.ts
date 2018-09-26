const validString = (text: any) => {
  return text != undefined && typeof text == 'string';
};

const validBoolean = (bool: any) => {
  return bool != undefined && typeof bool == 'boolean';
};

const validNumber = (num: any) => {
  return num != undefined && typeof num == 'number';
};

const sanitizePath = (path: string) => {
  return path.replace(/\/$/g, '');
};

const calculateTime = (time: number) => {
  time = time * 1000;
  return Math.round(time);
};

const getCurrentTimestamp = () => {
  return Date.now();
};

const getDurationFromTimestampToNow = (timestamp: number) => {
  return getCurrentTimestamp() - timestamp;
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getCookie = (cname: string) => {
  const name = cname + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }

  return '';
};

const noOp = () => {};

const times = function(fn: Function, times: number) {
  let count = 0;
  let retVal: any;
  return function() {
    if (count >= times) {
      return retVal;
    }
    retVal = fn.apply(null, arguments);
    count++;
    return retVal;
  };
};

const once = (fn: Function) => {
  return times(fn, 1);
};

const getHiddenProp = () => {
  const prefixes = ['webkit', 'moz', 'ms', 'o'];
  if ('hidden' in document) {
    return 'hidden';
  }
  for (let i = 0; i < prefixes.length; i++) {
    if (prefixes[i] + 'Hidden' in document) {
      return prefixes[i] + 'Hidden';
    }
  }
  return undefined;
};

const getCustomDataString = (customData: any): string | undefined => {
  if (typeof customData === 'object') {
    return JSON.stringify(customData);
  } else if (typeof customData === 'function') {
    return getCustomDataString(customData());
  } else if (typeof customData === 'undefined') {
    return customData;
  } else if (typeof customData !== 'string') {
    return String(customData);
  }

  return customData;
};

export default {
  validString,
  validBoolean,
  validNumber,
  sanitizePath,
  calculateTime,
  getCurrentTimestamp,
  getDurationFromTimestampToNow,
  generateUUID,
  getCookie,
  noOp,
  times,
  once,
  getHiddenProp,
  getCustomDataString,
};
