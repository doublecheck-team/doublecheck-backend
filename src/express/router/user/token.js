/**
 * doubleCheck
 */
"use strict"

const userTokenQuery = require("../../query/user/token");

module.exports.router = function (mysql, util, moment, { validatioinResult, validationHandler, body ,query, header }, verify ) {
    this.PREFIX = 'user';

    const tokenValidator = [header("authorization").notEmpty().isString(), validationHandler.handle];

    /**
     * no. 2003
     * 토큰 재발행 api
     */
    this.POST("token", tokenValidator, verify.refreshVerify, async (req, res) => {
        try {
            let reqData = matchedData(req);

            let token = util.createJWT(reqData.userInfo);

            let updateToken = await mysql.execute(userTokenQuery.updateToken(), [token.refreshToken, reqData.userInfo.id]);

            if (!updateToken.success || updateToken.affectedRows === 0) {
                res.failResponse("QueryError");
                return;
            }

            return res.successResponse(token);
        } catch (error) {
            log.error(error);
            res.failResponse("ServerError");
            return;
        }
    });
}