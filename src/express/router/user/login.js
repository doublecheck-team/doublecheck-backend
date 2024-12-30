/**
 * doubleCheck
 */
"use strict"

const axiox = require("axios");
const userLoginQuery = require("../../query/user/login");


module.exports.router = function (mysql, util, moment, { matchedData, validationResult, validationHandler, body, query }, schema ) {
    this.PREFIX = 'user';

    /**
     * no. 2001
     * 카카오 로그인 api
     */
    this.POST("login", async (req, res) => {
        try {
            let code = req.headers.authorization;

            code = code.split(" ")[1];

            let getKakaoToken = await axios.post("https://kauth.kakao.com/oauth/token", null, {
                params: {
                    grand_type: "authorization_code",
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

            let userData = {
                email: getUserData.data.kakao_account.email,
                nickName: getUserData.data.kakao_account.profile.nickname,
            };

            // 회원 가입 유저 여부 조회
            let checkUser = await mysql.query(userLoginQuery.checkUser(), [userData.email]);

            if (!checkUser.success) {
                res.failResponse("QueryError");
                return;
            }

            let data = {};

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

                    let token = util.createJWT(tokenData);

                    let etcUser = await method.query(userLoginQuery.etcUser(), []);

                    if (!etcUser.success) {
                        return mysql.TRANSACTION;
                    }

                // 기존 회원인 경우
                } else {
                    
                }
            })
        } catch (error) {
            log.error(error);
            res.failResponse("ServerError");
            return;
        }
    })
}