/**
 * doubleCheck
 */
"use strict"

const mysql = {};
const engine = require("mysql2/promise");
const { util, log } = require("../util");
const CONFIG = global.CONFIG;

mysql._runningBeat = false;

mysql._writerPools = [];
mysql._readerPools = [];

mysql.TRANSACTION = {
    ROLLBACK: 0,
    COMMIT: 1,
};

mysql.CONNECTION_TYPE = {
    READER: 0,
    WRITER: 1,
};

/**
 * mysql 엔진 초기화
 * @returns
 */
mysql.init = async function () {
    return new Promise((resolve, reject) => {
    let connectionAdditionalOptions = {
        waitForConnections: true,
        enableKeepAlive: true,
        maxIdle: CONFIG.database.connection.config.connectionLimit,
        supportBigNumbers: true,
        multipleStatements: true,
        dateStrings: true,
        decimalNumbers: true,
        ...CONFIG.database.connection.config,
    };

    // WRITER 풀 초기화
    CONFIG.database.connection.writer.forEach((writer) => {
        const pool = engine.createPool({
            ...connectionAdditionalOptions,
            host: writer.host,
            port: writer.port,
        });
        this._writerPools.push(pool);
    });

    // READER 풀 초기화
    CONFIG.database.connection.reader.forEach((reader) => {
        const pool = engine.createPool({
            ...connectionAdditionalOptions,
            host: reader.host,
            port: reader.port,
        });
        this._readerPools.push(pool);
    });

    this.testConnection(resolve, reject);
});
};

/**
 * DB와 연결 테스트
 * @param {Function} resolve 성공 시
 * @param {Function} reject 실패 시
 */
mysql.testConnection = async function (resolve, reject) {
    let result = await this.query(`SELECT 1;`, [], { silent: true });

    if (result.success) {
        this.createBeatInterval();

        log.info(`MySQL - Connection check: OK!`);

        resolve();
    } else {
        reject(new Error("Failed to test DB connection"));
    }
};

/**
 * DB와 연결을 유지하기 위해 ping 패킷 전송 interval 생성
 */
mysql.createBeatInterval = async function () {
    let res = await this.query(`SHOW SESSION VARIABLES LIKE 'wait_timeout'`, null, { silent: true });

    if (!res.success || res.rows.length === 0) {
        log.warn(`MySQL - WARN: Heartbeat check failed (reason: FAIL:DB)`);
        return;
    }

    if (res.rows[0]?.Variable_name !== "wait_timeout") {
        log.warn(`MySQL - WARN: Heartbeat check failed (reason: FAIL:VARIABLE_NOT_EXISTS)`);
        return;
    }

    let value = Number(res.rows[0].Value);

    if (!Number.isInteger(value)) {
        log.warn(`MySQL - WARN: Heartbeat check failed (reason: FAIL:VALUE_INVALID)`);
        return;
    }

    const interval = Math.max(Math.floor(value / 2), 30) * 1000;

    setInterval(() => this._runBeatPacket(), interval);
};

/**
 * 연결을 지속적으로 유지하지 위해 ping 패킷 전송
 */
mysql._runBeatPacket = async function () {
    if (this._runningBeat) return;

    this._runningBeat = true;

    await this.query(`SELECT 1;`, null, { silent: true });

    this._runningBeat = false;
};

/**
 * mysql 연결 반환
 * @param {mysql.CONNECTION_TYPE} connectionType
 * @returns {Connection} connection
 */
mysql._getConnection = async function (connectionType) {
    try {
        let pools = connectionType === mysql.CONNECTION_TYPE.WRITER
            ? this._writerPools
            : this._readerPools;

        for (let pool of pools) {
            try {
                const connection = await pool.getConnection();
                if (connection) {
                    return connection;
                }
            } catch (error) {
                log.error(`MySQL - Connection Error (Error: ${error.stack ?? error})`);
            }
        }

        return null;
    } catch (error) {
        log.error(`MySQL - Connection error (error: ${error.stack ?? error})`);
        return null;
    }
};

/**
 * 트랜젝션 조각 실행
 * @param {object} process query method list
 * @returns {object} 성공 여부, commit 여부
 */
mysql._transactionStatement = function (process) {
    return new Promise(async (resolve, _) => {
        let connection;
        let rollbackDisabled;

        try {
            connection = await this._getConnection(mysql.CONNECTION_TYPE.WRITER);

            if (!connection) {
                return {
                    success: false,
                };
            }

            let processMethods = {
                query: async (query, params = [], options = {}) => {
                    return await this.query(query, params, { ...options, connection: connection, manualRelease: true });
                },

                execute: async (query, params = [], options = {}) => {
                    return await this.execute(query, params, { ...options, connection: connection, manualRelease: true });
                },
            };

            await connection.beginTransaction();

            let result = await process(processMethods);

            if (result === this.TRANSACTION.COMMIT) {
                await connection.commit();
            } else if (result === this.TRANSACTION.ROLLBACK) {
                await connection.rollback();
                rollbackDisabled = true;
            }

            resolve({
                success: true,
                commit: result === this.TRANSACTION.COMMIT,
            });
        } catch (error) {
            log.error(`MySQL - Transaction Statement Error (Error: ${error.stack ?? error})`);

            if (connection && !rollbackDisabled) {
                try {
                    await connection.rollback();
                } catch (error) {
                    log.error(`MySQL - Transaction Rollback Error (Error: ${error.stack ?? error})`);
                }
            }
        } finally {
            if (connection) {
                try {
                    connection.release();
                } catch (error) {
                    log.error(`MySQL - Connection Release Error (Error: ${error.stack ?? error})`);
                }
            }
        }
    });
};

/**
 * mysql begin transaction
 * @param {Connection} connection connection
 * @returns {boolean} success
 */
mysql.beginTransaction = async function (connection) {
    try {
        await connection.beginTransaction();

        return true;
    } catch (error) {
        log.error(`MySQL - Transaction Error (Error: ${error.stack ?? error})`);

        return false;
    }
};

/**
 * mysql commit
 * @param {Connection} connection connection
 * @returns {boolean} success
 */
mysql.commit = async function (connection) {
    try {
        await connection.commit();

        return true;
    } catch (error) {
        log.error(`MySQL - Commit Error (Error: ${error.stack ?? error})`);

        return false;
    }
};

/**
 * mysql rollback
 * @param {Connection} connection connection
 * @returns {boolean} success
 */
mysql.rollback = async function (connection) {
    try {
        await connection.rollback();

        return true;
    } catch (error) {
        log.error(`MySQL - Rollback Error (Error: ${error.stack ?? error})`);

        return false;
    }
};

/**
 * mysql release
 * @param {Connection} connection connection
 * @returns {boolean} success
 */
mysql.release = async function (connection) {
    try {
        if (connection) {
            connection.release();
        }

        return true;
    } catch (error) {
        log.error(`MySQL - Release Error (Error: ${error.stack ?? error})`);

        return false;
    }
};

/**
 * mysql query 문자열을 분석하여 WRITER, READER 타입 구분
 * @param {string} query SQL 쿼리문
 */
mysql._getQueryType = function (query) {
    let queryLine = query.split(";");

    for (let v of queryLine) {
        v = v.trim().toLowerCase();

        if (v.startsWith("insert") || v.startsWith("update") || v.startsWith("delete")) {
            return this.CONNECTION_TYPE.WRITER;
        }
    }

    return this.CONNECTION_TYPE.READER;
};

mysql.query = async function (query, params = [], options = {}) {
    let connection;

    if (!options.connection) {
        connection = await this._getConnection();

        if (!connection) {
            return {
                success: false,
            };
        }
    } else {
        connection = options.connection;
    }

    let clusterId = connection?.connection?._clusterId ?? "unknown";

    try {
        let [rows, fields] = await connection.query(query, params);

        if (!options.silent) log.info(`MySQL - :${clusterId} [${query}] > Success`);

        return {
            success: true,
            rows: rows,
        };
    } catch (error) {
        log.error(`MySQL - :${clusterId} Query Error: [${query}] (Error: ${error.stack ?? error})`);

        return {
            success: false,
        };
    } finally {
        if (!options.manualRelease) {
            try {
                connection.release();
            } catch (error) {
                log.critical(`MySQL - :${clusterId} Release Error (Error: ${error.stack ?? error})`);
            }
        }
    }
};

/**
 * mysql execute 실행
 * @param {string} query SQL 쿼리문
 * @param {Array} params 데이터 배열
 * @param {object} options 연결 객체 지정, 성공 로그 비활성화, 수동 릴리즈 옵션
 * @returns {object} 성공 여부, 데이터 값
 */
mysql.execute = async function (query, params = [], options = {}) {
    let connection;

    if (!options.connection) {
        connection = await this._getConnection();

        if (!connection) {
            return {
                success: false,
            };
        }
    } else {
        connection = options.connection;
    }

    let clusterId = connection?.connection?._clusterId ?? "unknown";

    try {
        let [rows, fields] = await connection.execute(query, params);

        if (!options.silent) log.info(`MySQL - :${clusterId} [${query}] > Success`);

        return {
            success: true,
            rows: rows,
        };
    } catch (error) {
        log.error(`MySQL - :${clusterId} Execute Error: [${query}] (Error: ${error.stack ?? error})`);

        return {
            success: false,
        };
    } finally {
        if (!options.manualRelease) {
            try {
                connection.release();
            } catch (error) {
                log.critical(`MySQL - :${clusterId} Release Error (Error: ${error.stack ?? error})`);
            }
        }
    }
};

module.exports = mysql;
