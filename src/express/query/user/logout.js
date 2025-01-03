/**
 * doubleCheck
 */
"use strict"

const schema = CONFIG.database.schema;

module.exports = {

    deleteToken: () => `
        DELETE FROM ${schema}.verification
        WHERE key_user = ?
        ;
    `
};