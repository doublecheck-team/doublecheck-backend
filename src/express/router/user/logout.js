/**
 * doubleCheck
 */
"use strict"

const userLogoutQuery = require("../../query/user/logout");

module.exports.router = function (mysql, util, moment, { matchedData, validationResult, validationHandler, body, query, header }, verify) {
    this.PREFIX = 'user';

    const logoutValidator = [header("authorization").notEmpty().isString(), validationHandler.handle];

    /**
     * no. 2002
     * 로그아웃 api
     */
    this.POST("logout", logoutValidator, verify.refreshVerify, async (req, res) => {
        try {
            let reqData = matchedData(req);

            let deleteToken = await mysql.execute(userLogoutQuery.deleteToken(), [reqData.userInfo.keyUser]);

            if (!deleteToken.success) {
                res.failResponse("QueryError");
                return;
            }

            return res.successResponse();
        } catch (error) {
            log.error(error);
            res.failResponse("ServerError");
            return;
        }
    })
}