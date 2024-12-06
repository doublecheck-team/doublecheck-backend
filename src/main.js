/**
 * doubleCheck
 */
"use strict"

const moment = require("moment-timezone");
const SERVICE_INIT_WAIT = 30;


// ? process.send 함수가 없을 경우 고려 (https://stackoverflow.com/questions/30585540/process-send-is-conditionally-defined-in-node-js)
process.send = process.send || function () {};

/**
 * 서비스 초기화
 * @returns
 */
async function init() {
    let log;
    let init = false;

    try {
        // 서비스 초기화 중 blocking이 발생했을 경우 알릴 수 있는 로직
        setTimeout(() => {
            if (init) return;

            if (log) {
                log.error("Service initialize is incomplete!");
            } else {
                console.error("Service initialize is incomplete!");
            }

            process.exit(1);
        }, 1000 * SERVICE_INIT_WAIT);

        // moment 로캘 설정
        moment.locale("ko");

        //  전역 변수 셋팅
        global.GV = {
            // 프로젝트 루트 경로
            rootLocation: require("path").join(__dirname, "../"),
            isFirstInstance: (process.env.NODE_APP_INSTANCE ?? "0") === "0", 
        };

        // 글로벌 Config 설정
        if (!global.CONFIG) {
           global.CONFIG = require("./config/main");
        }

        let util = require("./util");
        log = util.log;

        // 현재 NODE_ENV 출력
        log.info(`NODE_ENV: ${process.env.NODE_ENV ?? "unknown"}`);

        // Mysql
        let mysql = require("./mysql/main");
        await mysql.init();

        // Express
        let express = require("./express/main");
        await express.init();

        log.info("System ready");
        init = true;

        process.send("ready");
    } catch (error) {
        // log 객체가 이미 로드 되었을 경우 Log로 출력
        if (log) {
            log.error(`${error.stack ?? error}`);
            log.error("Service initialize stopped.");
        } else {
            console.error(error.stack ?? error);
            console.error("Service initialize stopped.");
        }
    }
}

init();