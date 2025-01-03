/**
 * doubleCheck
 */
"use strict"

const jwt = require("jsonwebtoken");
const CONFIG = global.CONFIG;

module.exports = {
    jwtVerify: (req, res, next) => {
        let authHeader = req.headers["authorization"];

        if (!req || !req.headers || !authHeader) {
            res.failResponse("AuthorizationNull");
            return;
        }

        let token = authHeader.split(" ")[1];

        jwt.verify(token, CONFIG.jwt.secret, (error, userInfo) => {
            if (error) {
                if (error.name === "TokenExpiredError") {
                    res.failResponse("AuthorizationExpired");
                    return;
                } else {
                    res.failResponse("AuthorizationInvalid");
                    return;
                }
            }

            req.userInfo = userInfo;

            next();
        });
    },

    refreshVerify: (req, res, next) => {
        let authHeader = req.headers["authorization"];

        if (!req || !req.headers || !authHeader) {
            res.failResponse("AuthorizationNull");
            return;
        }

        let token = authHeader.split(" ")[1];

        jwt.verify(token, CONFIG.jwt.secret, (error, userInfo) => {
            if (error) {
                if (error.name === "TokenExpiredError") {
                    res.failResponse("AuthorizationFailed");
                    return;
                } else {
                    res.failResponse("AuthorizationInvalid");
                    return;
                }
            }

            req.userInfo = userInfo;

            next();
        });
    },
};