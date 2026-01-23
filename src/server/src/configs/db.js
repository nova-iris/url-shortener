const mysql = require("mysql2/promise");

// Database configuration from environment variables
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "urlshortener",
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// SQL schema for the urls table
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url_code VARCHAR(20) NOT NULL UNIQUE,
    long_url TEXT NOT NULL,
    short_url VARCHAR(255) NOT NULL,
    click_count INT DEFAULT 0,
    user_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP NULL DEFAULT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_url_code (url_code),
    INDEX idx_long_url (long_url(255)),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

/**
 * Initialize the database schema
 * Creates the urls table if it doesn't exist
 */
const initializeSchema = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.execute(CREATE_TABLE_SQL);
        connection.release();
        console.log("Database schema initialized successfully");
    } catch (err) {
        console.error("Error initializing database schema:", err);
        throw err;
    }
};

/**
 * Connect to the database and initialize schema
 */
const connect = async () => {
    try {
        // Test connection
        const connection = await pool.getConnection();
        console.log(`Connected to MariaDB at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        connection.release();

        // Initialize schema
        await initializeSchema();

        return pool;
    } catch (err) {
        console.error("MariaDB connection error:", err);
        throw err;
    }
};

/**
 * Close the connection pool gracefully
 */
const close = async () => {
    try {
        await pool.end();
        console.log("Database connection pool closed");
    } catch (err) {
        console.error("Error closing database connection pool:", err);
        throw err;
    }
};

/**
 * Get the connection pool
 */
const getPool = () => pool;

module.exports = {
    connect,
    close,
    getPool,
    pool,
};