class Logger {
  constructor(showLogs = false) {
    (this as any).showLogs = showLogs;
  }

  setLogging(logging: any) {
    (this as any).showLogs = logging;
  }

  isLogging() {
    return (this as any).showLogs;
  }

  log(msg: any, ...optionalParamters: any[]) {
    if (!(this as any).showLogs) {
      return;
    }

    console.log(msg, ...optionalParamters);
  }

  error(msg: any) {
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

export const padRight = (str: any, length: number) => {
  const padStr = new Array(length).join(' ');
  return (str + padStr).slice(0, length);
};

const logger = new Logger();
export default logger;
