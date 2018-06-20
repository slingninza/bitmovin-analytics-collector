class Logger {
  constructor(showLogs = false) {
    this.showLogs = showLogs;
  }

  setLogging(logging) {
    this.showLogs = logging;
  }

  isLogging() {
    return this.showLogs;
  }

  log = function(msg) {
    if (!this.showLogs) {
      return;
    }

    console.log(msg);
  };

  error = function(msg) {
    if (!this.showLogs) {
      return;
    }

    console.error(msg);
  };

  warning = function(msg) {
    if (!this.showLogs) {
      return;
    }

    console.warn(msg);
  }
}

export const padRight = (str, length) => {
  const padStr = new Array(length).join(' ');
  return (str + padStr).slice(0, length);
};

const logger = new Logger();
export default logger;
