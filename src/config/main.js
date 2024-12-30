/**
 * doubleCheck
 */
"use strict"

const dotenv = require("dotenv");

const envFilePath = (() => {
    const env = process.env.NODE_ENV || "local";
    
    switch (env) {
        case "prod":
            return "./.env.prod";
        case "dev":
            return "./.env.dev";
        default:
            return "./.env.local";
    }
})();

dotenv.config({ path: envFilePath });

const config = {
    log: {
        dir: process.env.LOG_DIR,
    },

    webServer: {
        host: process.env.WS_HOST,
        port: process.env.WS_PORT,

        rateLimit: {
            windowMs: process.env.WS_RATE_LIMIT_WINDOW_MS,
            max: process.env.WS_RATE_LIMIT_MAX
        },

        cors: {
            allowOrigin: process.env.WS_CORS_ALLOW_ORIGIN,
        },
    },

    database: {
        connection: {
            writer: [],

            reader: [],

            config: {
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                connectionLimit: process.env.DB_CONNECTION_LIMIT,
            },
        },

        schema: {
            COMMON: process.env.SCHEMA_COMMON,
        },
    },

    kakao: {
        client_id: process.env.CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
    },
}


for (let v of process.env.DB_HOST_WRITER.split(",")) {
    v = v.trim();

    let hostSplit = v.trim().split(":").map((v2) => v2.trim());

    config.database.connection.writer.push({
        host: hostSplit[0],
        port: hostSplit[1],
    });
}

for (let v of process.env.DB_HOST_READER.split(",")) {
    v = v.trim();

    let hostSplit = v.trim().split(":").map((v2) => v2.trim());

    config.database.connection.reader.push({
        host: hostSplit[0],
        port: hostSplit[1],
    });
}

module.exports = config;