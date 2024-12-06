/**
 * doubleCheck
 */
"use strict"

const validationHandler = {};

const mysql = require("../mysql/main");
const { util, log } = require("../util");
const { validationResult } = require("express-validator");

// 운영 환경에서는 query, body 로그 생성 하지 않음
if (process.env.NODE_ENV === "prod") {
    validationHandler.handle = (req, res, next) => {
        let result = validationResult(req);

        if (!result.isEmpty()) {
            res.failResponse("ParameterInvalid");
            return;
        }

        next();
    };
} else {
    validationHandler.handle = (req, res, next) => {
        let result = validationReulst(req);

        if (req.method === "GET") {
            log.debug(req.query);
        } else {
            log.debug(req.body);
        }

        if (!result.isEmpty()) {
            log.debug(result.array());

            res.failResponse("ParameterInvalid");
            return;
        }

        next();
    };
}

validationHandler.existsCheckDatabase = async (schema, whereFieldList, whereValueList = []) => {
    let result = await mysql.execute(
        `SELECT EXISTS(SELECT 1 FROM ${schema} WHERE ${whereFieldList.join(" = ? AND ") + " = ?"}) AS data_exists;`,
        whereValueList,
    );

    if (!result.success) {
        return false;
    }

    if (result.row[0]?.data_exists !== 1) {
        return false;
    }

    return true;
};

module.exports = validationHandler;