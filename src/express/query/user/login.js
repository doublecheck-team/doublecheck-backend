/**
 * doubleCheck
 */
"use strict"

module.exports = {
    
    userInfo: () => `
        SELECT key_user AS keyUser, email, nick, gender, age, profile
        FROM user
        WHERE email = ?
        ;
    `,

    joinUser: () => `
        INSERT INTO user
        (email, gender, age, profile)
        VALUES
        (?, ?, ?, ?);

        SELECT * FROM user WHERE key_user = LAST_INSERT_ID();
    `,

    tokenUser: () => `
        INSERT INTO verification
        (key_user, token)
        VALUES
        (?, ?);
    `,

    inputToken: () => `
        UPDATE verification
        SET token = ?
        WHERE key_user = ?;
    `
}