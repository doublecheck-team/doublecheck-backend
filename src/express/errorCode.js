/**
 * doubleCheck
 */
"use strict"

const errorCode = {};

errorCode.errors = {
    ParameterInvalid:               { code: 1001, message: "Parameter invalid" },
    TimestampInvalid:               { code: 1002, message: "Timestamp invalid" },

    NotFound:                       { code: 2000, message: "Not found" },
    ServerError:                    { code: 2001, message: "Server error" },
};

errorCode.get = function (errorCode) {
    return this.errors[errorCode];
};

module.exports = errorCode;