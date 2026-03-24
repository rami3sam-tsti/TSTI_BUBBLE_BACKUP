const winston = require("winston");
const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Pretty console format
const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }), // show stack for errors
  printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] ${level}: ${stack || message}`;

    if (Object.keys(meta).length) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// JSON format for files
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: "info",
  transports: [
    // 👇 Pretty console logs
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // 👇 JSON file logs
    new winston.transports.File({
      filename: "logs/app.log",
      format: fileFormat,
    }),

    // 👇 Optional: separate error file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
    }),
  ],
});

module.exports = logger;