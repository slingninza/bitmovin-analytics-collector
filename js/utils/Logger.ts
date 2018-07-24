class Logger {
  constructor(showLogs: boolean = false) {
    (this as any).showLogs = showLogs;
  }

  setLogging(logging: boolean) {
    (this as any).showLogs = logging;
  }

  isLogging() {
    return (this as any).showLogs;
  }

  log(msg: string, ...optionalParamters: any[]) {
    if (!(this as any).showLogs) {
      return;
    }

    console.log(msg, ...optionalParamters);
  }

  error(msg: string | undefined) {
    if (!(this as any).showLogs) {
      return;
    }

    console.error(msg);
  }

  warning(msg: string) {
    if (!(this as any).showLogs) {
      return;
    }

    console.warn(msg);
  }
}

export const padRight = (str: string | undefined, length: number) => {
  const padStr = new Array(length).join(' ');
  return (str + padStr).slice(0, length);
};

export const logger = new Logger();
