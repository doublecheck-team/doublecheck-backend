/**
 * doubleCheck
 */
"use strict"

const schema = config.database.schema;

module.exports = {

    deleteToken: () => `
        DELETE FROM ${schema}.verification
        WHERE key_user = ?
        ;
    `
};