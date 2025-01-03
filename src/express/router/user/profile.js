/**
 * doubleCheck
 */
"use strict"

const profileQuery = require("../../query/user/profile");

module.exports.router = function (mysql, util, moment, { validatioinResult, validationHandler, body ,query, header }, verify ) {
    this.PREFIX = 'user';

    const getUserValidator = [header("authorization").notEmpty().isString(), validationHandler.handle];

    const putUserValidator = [
        header("authorization").notEmpty().isString()
        , body("nick").optional().isString(),
        , body("age").optional().isString(),
        , body("profile").optional().isString(),
    ];

    /**
     * no. 2004
     * 회원 정보 조회 api
     */
    this.GET("profile", getUserValidator, verify.tokenVerify, async (req, res) => {
        try {
            let reqData = matchedData(req);

            let result = await mysql.query(profileQuery.getUserData(), [reqData.userInfo.id]);

            if (!result.success || result.rows[0].length === 0) {
                res.failResponse("QueryError");
                return;
            }

            return res.successResponse(result);
        } catch (error) {
            log.error(error);
            res.failResponse("ServerError");
            return;
        }
    });

    /**
     * no. 2005
     * 회원 정보 수정 api
     */
    this.PUT("profile", putUserValidator, verify.tokenVerify, async (req, res) => {
        try {
            let reqData = matchedData(req);

            // option 값들의 존재 유무에 따라 queryParams 배열 요소 조정
            let queryParams = Object.entries(reqData.body).filter(([key, value]) => value).map(([key, value]) => value);

            queryParams.push(reqData.userInfo.id);

            let result = await mysql.execute(profileQuery.putUserData(reqData), queryParams);

            if (!result.success || result.affectedRows === 0) {
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