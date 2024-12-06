/**
 * doubleCheck
 */
"use strict"

const log = require("./log");
const util = require("./util");

// 순환 의존성 제거를 위해 아래와 같이 처리
module.exports.util = util;
module.exports.log = log;

// util, log 로드 완료 후 필요한 모듈을 아래에서 로드
module.exports.httpRequest = require("./httpRequest");