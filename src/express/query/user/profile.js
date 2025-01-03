/**
 * doubleCheck
 */
"use strict"

const schema = CONFIG.database.schema;

module.exports = {
    
    getUserData: () => `
        SELECT 
            key_user AS keyUser
            , email
            , nick
            , gender
            , age
            , profile
            , reg_date
        FROM ${schema}.user
        WHERE key_user = ?
        ;
    `,

    putUserData: (reqData) => `
        UPDATE ${schema}.user
        SET
            ${reqData.body.nick ? `nick = ?` : ''}
            ${reqData.body.gender ? `gender = ?` : ''}
            ${reqData.body.age ? `age = ?` : ''}
            ${reqData.body.profile ? `profile = ?` : ''}
        WHERE key_user = ?
        ;
    `
}