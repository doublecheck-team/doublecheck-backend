/**
 * doubleCheck
 */
"use strict"

const path = require("path");
const util = require("node:util");
const moment = require("moment-timezone");
const winston = require("winston");
const winstonDaily = require("winston-daily-rotate-file");
const CONFIG = global.CONFIG;

const { combine, timestamp, label, printf, prettyPrint } = winston.format;

const logDir = path.join(process.cwd(), CONFIG.log.dir);

const logFormat = printf(({ level, message, timestamp }) => {
    if (typeof message === "object") {
        message = util.inspect(message, { depth: null });
    }

    // 날짜 로그레벨 메세지
    return `${timestamp} ${level}: ${message}`;
});

const timezoneStamp = () => {
    return "[" + moment.tz("Asia/Seoul").format("HH:mm:ss.SSS") + "]";
};

const winstonConfig = {
    levels: {
        // 숫자가 낮을수록 우선순위가 높음
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
        yell: 7,
    },
    colors: {
        // 각 레벨에 대한 색상 지정
        error: "red",
        warn: "yellow",
        info: "green",
        data: "megenta",
        verbose: "cyan",
        debug: "blue",
        silly: "grey",
    },
};

// 컬러 적용
winston.addColors(winstonConfig.colors);

const log = winston.createLogger({
    levels: winstonConfig.levels,
    format: combine(timestamp({ format: timezoneStamp }), logFormat),

    transports: [
        new winstonDaily({
            level: "yell",
            datePattern: "YYYY-MM-DD",
            dirname: logDir,
            filename: `%DATE%.log`,
            maxSize: "10m",
            utc: true,
            zippedArchive: false,
        }),

        new winstonDaily({
            level: "error",
            datePattern: "YYYY-MM-DD",
            dirname: logDir,
            filename: `%DATE%.error.log`,
            maxSize: "10m",
            utc: true,
            zippedArchive: false,
        }),
    ],

    exceptionHandlers: [
        new winstonDaily({
            level: "error",
            datePattern: "YYYY-MM-DD",
            dirname: logDir,
            filename: `%DATE%.unhandled-exception.log`,
            maxSize: "10m",
            utc: true,
            zippedArchive: false,
        }),
    ],

    exitOnError: false,
});

log.add(
    new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
        level: "yell",
        format: winston.format.combine(
            winston.format.colorize(),
            logFormat,
        ),
    }),
);

module.exports = log;