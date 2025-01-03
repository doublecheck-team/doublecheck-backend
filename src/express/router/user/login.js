/**
 * doubleCheck
 */
"use strict"

const axios = require("axios");
const userLoginQuery = require("../../query/user/login");


module.exports.router = function (mysql, util, moment, { matchedData, validationResult, validationHandler, body, query, header }, verify) {
    this.PREFIX = 'user';

    const loginValidator = [header("authorization").notEmpty().isString(), validationHandler.handle];

    /**
     * no. 2001
     * 카카오 로그인 api
     */
    this.POST("login", loginValidator, async (req, res) => {
        try {
            let reqData = matchedData(req);

            let code = reqData.headers.authorization;

            code = code.split(" ")[1];

            let getKakaoToken = await axios.post("https://kauth.kakao.com/oauth/token", null, {
                params: {
                    grant_type: "authorization_code",
                    client_id: CONFIG.kakao.client_id,
                    redirect_uri: CONFIG.kakao.redirect_uri,
                    code: code,
                },
            });

            let kakaoToken = getKakaoToken.data.access_token;

            if (!kakaoToken) {
                res.failResponse("ParameterInvalid");
                return;
            }

            let getUserData = await axios.get("https://kapi.kakao.com/v2/user/me", {
                headers: {
                    Authorization: `Bearer ${kakaoToken}`,
                },
            });

            let userData = util.getUserInfo(getUserData);

            // 회원 가입 유저 여부 조회
            let checkUser = await mysql.query(userLoginQuery.userInfo(), [userData.email]);

            if (!checkUser.success) {
                res.failResponse("QueryError");
                return;
            }

            let data = {};
            let token;
            let result = await mysql.transactionStatement(async (method) => {
                // 신규 회원인 경우
                if (checkUser.rows.length === 0) {
                    let joinUser = await method.query(userLoginQuery.joinUser(), [userData.email, userData.nickName, userData.email]);

                    if(joinUser.rows[1].length === 0 || !joinUser.success) {
                        return mysql.TRANSACTION.ROLLBACK;
                    }

                    let tokenData = {
                        id: joinUser.rows[1].id,
                        email: userData.email,
                    };

                    token = util.createJWT(tokenData);

                    let tokenUser = await method.query(userLoginQuery.tokenUser(), [joinUser.rows[1].id, token.refreshToken]);

                    if (!tokenUser.success) {
                        return mysql.TRANSACTION.ROLLBACK;
                    }

                // 기존 회원인 경우
                } else {

                    let tokenData = {
                        id: checkUser.rows[0].keyUser,
                        email: userData.email,
                    };

                    token = util.createJWT(tokenData);

                    let inputToken = await method.query(userLoginQuery.inputToken(), [token.refreshToken, tokenData.id]);

                    if (!inputToken.success || inputToken.affectedRows === 0) {
                        return mysql.TRANSACTION.ROLLBACK;
                    }
                }

                return mysql.TRANSACTION.COMMIT;
            })

            if (!result.success) {
                res.failRepsonse("TransactionError");
                return;
            }

            let userInfo = await mysql.query(userLoginQuery.userInfo(), [userData.email]);

            if (!userInfo.success) {
                res.failResponse("QueryError");
                return;
            }

            data = {
                keyUser: userInfo.rows[0].keyUser,
                email: userInfo.rows[0].email,
                nick: userInfo.rows[0].nick,
                gender: userInfo.rows[0].gender,
                age: userInfo.rows[0].age,
                profile: userInfo.rows[0].profile,
                accessToken: token.accessToken,
                refreshToken: token.refreshToken
            }

            return res.successResponse(data);
        } catch (error) {
            log.error(error);
            res.failResponse("ServerError");
            return;
        }
    })
}