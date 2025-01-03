/**
 * doubleCheck
 */
"use strict"

const schema = CONFIG.database.schema;

module.exports = {
    
    userInfo: () => `
        SELECT key_user AS keyUser, email, nick, gender, age, profile
        FROM ${schema}.user
        WHERE email = ?
        ;
    `,

    joinUser: () => `
        INSERT INTO ${schema}.user
        (email, gender, age, profile)
        VALUES
        (?, ?, ?, ?);

        SELECT * FROM user WHERE key_user = LAST_INSERT_ID();
    `,

    tokenUser: () => `
        INSERT INTO ${schema}.user
        (key_user, token)
        VALUES
        (?, ?);
    `,

    inputToken: () => `
        UPDATE ${schema}.user
        SET token = ?
        WHERE key_user = ?;
    `
};