module.exports = {
    apps: [
        {
            name: "service-prod",
            script: "./src/main.js",
            exec_mode: "cluster",
            
            output: "./logs/pm2/prod/out.log",
            error: "./logs/pm2/prod/error.log",

            watch: false,
            source_map_support: false,
            autorestart: true,
            instances: 0,
            wait_ready: true,
            listen_timeout: 50000,
            kill_timeout: 10000,

            env: {
                NODE_ENV: "prod",
                TZ: "Asia/Seoul",
                SERVICE_CODE: "PRD"
            }
        },
        {
            name: "service-dev",
            script: "./src/main.js",
            exec_mode: "cluster",
            
            output: "./logs/pm2/dev/out.log",
            error: "./logs/pm2/dev/error.log",

            watch: false,
            source_map_support: false,
            autorestart: true,
            instances: 1,
            wait_ready: true,
            listen_timeout: 50000,
            kill_timeout: 10000,

            env: {
                NODE_ENV: "dev",
                TZ: "Asia/Seoul",
                SERVICE_CODE: "DEV"
            }
        },
        {
            name: "service-local",
            script: "./src/main.js",
            exec_mode: "cluster",
            
            output: "./logs/pm2/local/out.log",
            error: "./logs/pm2/local/error.log",

            watch: false,
            source_map_support: false,
            autorestart: true,
            instances: 1,
            wait_ready: true,
            listen_timeout: 50000,
            kill_timeout: 10000,

            env: {
                NODE_ENV: "local",
                TZ: "Asia/Seoul",
                SERVICE_CODE: "LOC"
            }
        },
    ]
}