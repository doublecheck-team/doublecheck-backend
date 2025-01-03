/**
 * doubleCheck
 */
"use strict"

const deleteQuery = require("../../query/user/delete");

module.exports.router = function (mysql, util, moment, { matchedData, validatioinResult, validationHandler, body ,query, header }, verify ) {
    this.PREFIX = 'user';

    const deleteValidator = [
        header("authorization").notEmpty().isString()
        , body("reason").notEmpty().isInt().isIn([1, 2, 3, 4, 5, 6])
        , validationHandler.handle];

    /**
     * no. 2006
     * 회원 탈퇴 api
     */
    this.PUT("delete", deleteValidator, verify.tokenVerify, async (req, res) => {
        try {
            let reqData = matchedData(req);

            let result = await mysql.transactionStatement(async (method) => {
                let queryParams = [];

                queryParams.push(reqData.userInfo.id, reqData.body.type);

                if (reqData.body.type == 7) {
                    queryParams.push(reqData.body.reason);
                }

                queryParams.push(reqData.userInfo.id);

                let deleteUser = await method.query(deleteQuery.deleteUser(reqData), queryParams);

                if (!deleteUser.success) {
                    return mysql.TRANSACTION.ROLLBACK;
                }

                return mysql.TRANSACTION.COMMIT;
            });

            if (!result.success) {
                res.failResponse("TransactionError");
                return;
            }

            return res.successResponse();
        } catch (error) {
            log.error(error);
            res.failResponse("ServerError");
            return;
        }
    });
}