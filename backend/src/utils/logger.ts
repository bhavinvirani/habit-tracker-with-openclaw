import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  silent: 5,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'test') return 'silent';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, stack, metadata } = info;

    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (metadata && Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Define transports - conditionally add based on environment
const isTest = process.env.NODE_ENV === 'test';

const transports = isTest
  ? [
      // Silent transport for tests
      new winston.transports.Console({
        silent: true,
      }),
    ]
  : [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize({ all: true }), format),
      }),

      // File transport - All logs
      new DailyRotateFile({
        filename: path.join('logs', 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(winston.format.uncolorize(), format),
      }),

      // File transport - Error logs only
      new DailyRotateFile({
        level: 'error',
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: winston.format.combine(winston.format.uncolorize(), format),
      }),
    ];

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join('logs', 'exceptions.log'),
    maxsize: 20971520, // 20MB
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join('logs', 'rejections.log'),
    maxsize: 20971520, // 20MB
  })
);

export default logger;
