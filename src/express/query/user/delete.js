/**
 * doubleCheck
 */
"use strict"

const schema = CONFIG.database.schema;

module.exports = {
    
    deleteUser: (reqData) => `
        INSERT INTO user_drop
        (key_user, type_drop, etc)
        VALUES
        (?, ?${reqData.body.type == 7 ? `, ?` : ''})
        ;

        UPDATE user
        SET del_date = CURRENT_TIMESTAMP
        WHERE key_user = ?
        ;
    `
}