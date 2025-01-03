/**
 * doubleCheck
 */
"use strict"

const schema = CONFIG.database.schema;

module.exports = {

    updateToken: () => `
        UPDATE ${schema}.verification
        SET token = ?
        WHERE key_user = ?
        ;
    `
}