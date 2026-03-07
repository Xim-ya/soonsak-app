/**
 * Production-safe Logger Module
 * Logs are only output in development mode (__DEV__)
 */

interface LoggerConfig {
  prefix?: string;
  enabled?: boolean;
}

const formatMessage = (prefix: string | undefined, ...args: unknown[]): unknown[] => {
  if (prefix) {
    return [`[${prefix}]`, ...args];
  }
  return args;
};

const createLogger = (config: LoggerConfig = {}) => {
  const { prefix, enabled = true } = config;

  const shouldLog = (): boolean => {
    return __DEV__ && enabled;
  };

  return {
    debug: (...args: unknown[]): void => {
      if (shouldLog()) {
        console.debug(...formatMessage(prefix, ...args));
      }
    },

    log: (...args: unknown[]): void => {
      if (shouldLog()) {
        console.log(...formatMessage(prefix, ...args));
      }
    },

    info: (...args: unknown[]): void => {
      if (shouldLog()) {
        console.info(...formatMessage(prefix, ...args));
      }
    },

    warn: (...args: unknown[]): void => {
      if (shouldLog()) {
        console.warn(...formatMessage(prefix, ...args));
      }
    },

    error: (...args: unknown[]): void => {
      if (shouldLog()) {
        console.error(...formatMessage(prefix, ...args));
      }
    },
  };
};

// Default logger instance
export const logger = createLogger();

// Named loggers for specific modules
export const Logger = {
  // Factory method to create a logger with a specific prefix
  create: (prefix: string, enabled = true) => createLogger({ prefix, enabled }),

  // Default methods
  debug: (...args: unknown[]): void => logger.debug(...args),
  log: (...args: unknown[]): void => logger.log(...args),
  info: (...args: unknown[]): void => logger.info(...args),
  warn: (...args: unknown[]): void => logger.warn(...args),
  error: (...args: unknown[]): void => logger.error(...args),
};

// Pre-configured loggers for common modules
export const DeviceIdLogger = Logger.create('DeviceId');
export const AnalyticsLogger = Logger.create('Analytics');
export const AuthLogger = Logger.create('Auth');
export const AdminLogger = Logger.create('Admin');
export const ContentLogger = Logger.create('Content');
export const YouTubeLogger = Logger.create('YouTube');
export const ScraperLogger = Logger.create('Scraper');
export const PushLogger = Logger.create('Push');
export const PlayerLogger = Logger.create('Player');
export const NavigationLogger = Logger.create('Navigation');
export const AppLogger = Logger.create('App');
export const NotificationLogger = Logger.create('LocalNotification');
export const SnackbarLogger = Logger.create('Snackbar');
export const ClarityLogger = Logger.create('Clarity');
export const LiquidGlassLogger = Logger.create('LiquidGlass');
export const UserLogger = Logger.create('User');
export const CommentLogger = Logger.create('Comment');
export const ChannelLogger = Logger.create('Channel');
export const RegistrationLogger = Logger.create('Registration');
export const VersionLogger = Logger.create('Version');

export default Logger;
