/**
 * doubleCheck
 */
"use strict"

const express = { _server: null, _init: false };

const engine = require("express");
const path = require("path");
const rateLimiter = require("express-rate-limit");
const cors = require("cors");
const mysql = require("../mysql/main");
const moment = require("moment-timezone");
const expressValidator = require("express-validator");
const validationHandler = require("./validationHandler");
const errorCode = require("./errorCode");
const { util, log } = require("../util");
const CONFIG = global.CONFIG;

/**
 * express 엔진 초기화
 * @returns
 */
express.init = () => {
    return new Promise(async (resolve, reject) => {
        try {
            if (this._init) return;

            // 웹서버 초기화 시작 ->
            let webServer = engine();

            // 프록시 신뢰 설정 (https://expressjs.com/ko/guide/behind-proxies.html)
            webServer.set("trust Proxy", 1);

            // 보안 미들웨어 등록
            webServer.use(require("helmet")());

            // gzip 압축 활성화
            webServer.use(require("compression")());

            webServer.use(
                cors({
                    origin: CONFIG.webServer.cors.allowOrigin,
                    credentials: true,
                }),
            );

            // 운영 환경일 시 Rate limit 등록
            if (process.env.NODE_ENV === "prod") {
                webServer.use(
                    rateLimiter({
                        windowMs: CONFIG.webServer.rateLimit.windowMs,
                        max: CONFIG.webServer.rateLimit.max,
                        standardHeaders: true,
                        legacyHeaders: false,
                        message: async (req, res) => {
                            return {
                                result: "N",
                                code: 1101,
                                message: "Too Many Request",
                            };
                        },
                    })
                );
            }

            // 클라이언트 ipAddress 반환하는 미들웨어 등록
            webServer.use(
                require("request-ip").mw({ attributeName: "ipAddress" })
            )

            // application/json, x-www-form-urlencoded 파싱을 위해 미들웨어 등록
            webServer.use(engine.json({ strict: false }));
            webServer.use(engine.urlencoded({ extended: true }));

            webServer.use((req, res, next) => {
                // 성공 함수
                res.successResponse = (data, statusCode) => {
                    let dataTable = {
                        result: "Y",
                        code: 0,
                        message: "Success",
                    };

                    if (data) {
                        dataTable.data = data;
                    }

                    res.status(statusCode ?? 200).json(dataTable);

                    this._printSuccessLog(req, res. dataTable);
                };

                res.failResponse = (code, data, statusCode) => {
                    let dataTable = {
                        result: "N",
                        code: 2000,
                        message: "Unknown Error",
                        ...errorCode.get(code),
                    };

                    if (data) {
                        dataTable = { ...dataTable, ...data };
                    }

                    if (statusCode !== 200) {
                        res.status(statusCode ?? 200).json(dataTable);
                        this._printFailLog(req, res, dataTable);
                    }
                };

                next();
            });

            webServer.use(express.validateTimestamp);

            // 라우터 파일 전체 로드를 위해 폴더 스캔
            let routerFiles = await util.getFilesInDirectoryDeep(
                path.join(
                    GV.rootLocation,
                    "src",
                    "express",
                    "router",
                    "**/index.js"
                )
            );

            let routers = engine.Router();

            // 루트
            routers.get("/", (req, res) => {
                res.send("");
            });

            // favicon에 대해 204 반환
            routers.get("/favicon.ico", (req, res) => {
                res.status(204).end();
            });

            if (routerFiles) {
                // async 함수의 경우 express 자체 오류 처리기에서 처리가 불가능하므로 처리가 가능하게 재정의 (https://programmingsummaries.tistory.com/399)
                let asyncFunctionSignature = (async () => {}).constructor;
                let errorProcessableHandler = (handler) => {
                    for (let k in handler) {
                        if (handler[k] instanceof asyncFunctionSignature) {
                            // 기존 handler 백업 후..
                            let v = handler[k];

                            // handler promise catch 문 추가 후 재정의
                            handler[k] = async (req, res, next) => {
                                await v(req, res, next).catch(next);
                            };
                        }
                    }

                    return handler;
                };

            const anonymousPath = ["/login"];

            // 라우터 파일에 넘겨줄 커스텀 함수 데이터 지정
            // ? this.PREFIX의 경우 router 파일 안에 있는 this.PREFIX 변수와 연동됨
            let routerFunction = {
                GET: (location, ...handler) => {
                    // ? 실수로 첫 문자를 /를 입력하여 지정할 경우 보정
                    if (location[0] === "/") {
                        location = location.substring(1);
                    }

                    let list = [express.validateTimestamp];

                    if (anonymousPath.includes(`${this.PREFIX}/${location}`)) {
                        list.push(errorProcessableHandler(handler));
                    }

                    routers.get(`/${this.PREFIX}/${location}`, list);
                },

                POST: (location, ...handler) => {
                    // ? 실수로 첫 문자를 /를 입력하여 지정할 경우 보정
                    if (location[0] === "/") {
                        location = location.substring(1);
                    }

                    let list = [express.validateTimestamp];

                    if (anonymousPath.includes(`${this.PREFIX}/${location}`)) {
                        list.push(errorProcessableHandler(handler));
                    }

                    routers.get(`/${this.PREFIX}/${location}`, list);
                },

                PUT: (location, ...handler) => {
                    // ? 실수로 첫 문자를 /를 입력하여 지정할 경우 보정
                    if (location[0] === "/") {
                        location = location.substring(1);
                    }

                    let list = [express.validateTimestamp];

                    if (anonymousPath.includes(`${this.PREFIX}/${location}`)) {
                        list.push(errorProcessableHandler(handler));
                    }

                    routers.get(`/${this.PREFIX}/${location}`, list);
                },

                DELETE: (location, ...handler) => {
                    // ? 실수로 첫 문자를 /를 입력하여 지정할 경우 보정
                    if (location[0] === "/") {
                        location = location.substring(1);
                    }

                    let list = [express.validateTimestamp];

                    if (anonymousPath.includes(`${this.PREFIX}/${location}`)) {
                        list.push(errorProcessableHandler(handler));
                    }

                    routers.get(`/${this.PREFIX}/${location}`, list);
                },
            };

            const routerIncludes = [
                mysql,
                util,
                moment,
                { ...expressValidator, validationHandler },
                CONFIG.defaultLanguage,
                CONFIG.database.schema,
            ];

            // 루프를 통해 router 폴더 내의 모든 라우터 파일 로드
            for (let v of routerFiles) {
                try {
                    // 라우터 로드
                    let routerModule = require(path.join(v));

                    if (!routerModule.router) {
                        log.error(`Express - Load Rejected [${v}] (Error: Unknown Router Format)`);
                        
                        continue;
                    }

                    routerModule.router.apply(
                        routerFunction,
                        routerIncludes
                    );

                } catch (error) {
                    log.error(`Express - Router group [/${routerFunction.PREFIX}] Failed to Load (error : ${error.stack ?? error})`);                    
                }
            }

            log.info(`Express - Router Loaded (${routerFiles.length} Files)`);

            webServer.use("/", routers);
        } else {
            log.error(`Express - Load Error (Error : Failed to Load Scan Router Files)`);
        }

        // Not found 처리
        webServer.use((req, res, next) => {
            if (!res.headersSent) {
                res.status(404).send("Not Found");
            }
        });

        // Server error 처리
        webServer.use((err, req, res, next) => {
            log.error(`Express - Server Error (Error: ${err.stack ?? err})`);
            if (!res.headersSent) {
                res.status(500).send("Server Error");
            }
        });

        // 해당 포트로 웹서버 리스닝
        webServer.listen(CONFIG.webServer.port, CONFIG.webServer.host, () => {
            log.info(`Express - Listening (${CONFIG.webServer.host}:${CONFIG.webServer.port})`);

            resolve();
        });

        // 웹서버 초기화 끝 ->
        this._server = webServer;
        this._init = true;

    } catch (error) {
        log.error(error);
        reject(error);
        }
    });
};

/**
 * 성공 응답 시 로그 출력
 * @param {Express.request} req Express request
 * @param {Express.response} res Express response
 * @param {object} dataTable Error code dataTable
 */
express._printSuccessLog = function (req, res, dataTable) {
    log.info(`Express - ${req.ipAddress} -> ${req.protocol.toUpperCase() ?? "unknown"}/${req.httpVersion} ${req.method.toUpperCase()} ${req.originalUrl} > ${res.statusCode} Success`);
};

/**
 * 실패 응답 시 로그 출력
 * @param {Express.request} req Express request
 * @param {Express.response} res Express response
 * @param {object} dataTable Error code dataTable
 */
express._printFailLog = function (req, res, dataTable) {
    log.warn(`Express - ${req.ipAddress} -> ${req.protocol.toUpperCase() ?? "unknown"}/${req.httpVersion} ${req.method.toUpperCase()} ${req.originalUrl} > ${res.statusCode} Fail (code: ${dataTable.code}, message: ${dataTable.message})`);
};

if (process.env.NODE_ENV === "production") {
    /**
     * timestamp 파라메터 검사 미들웨어
     * @param {Express.request} req Express request
     * @param {Express.response} res Express response
     * @param {Express.next} next Express next
     */
    express.validateTimestamp = function (req, res, next) {
        let timestamp = Number(req.method === "GET" ? req.query.timestamp : req.body.timestamp);
    
        if (!timestamp || !Number.isInteger(timestamp)) {
            res.failResponse("ParameterInvalid");
            return;
        }
    
        if (Math.abs(timestamp - util.getCurrentTimestamp()) > 10) {
            res.failResponse("TimestampInvalid");
            return;
        }
    
        next();
    };
} else {
    /**
     * timestamp 파라메터 검사 미들웨어
     * @param {Express.request} req Express request
     * @param {Express.response} res Express response
     * @param {Express.next} next Express next
     */
    express.validateTimestamp = function (req, res, next) {
        // 다음 미들웨어 실행
        next();
    };
}


module.exports = express;