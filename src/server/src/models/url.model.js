const { pool } = require("../configs/db");

/**
 * URL Model - SQL-based repository for URL operations
 */
const URLModel = {
    /**
     * Find a URL by its short code
     * @param {string} urlCode - The short URL code
     * @returns {Promise<Object|null>} The URL object or null if not found
     */
    async findByCode(urlCode) {
        const [rows] = await pool.execute(
            "SELECT * FROM urls WHERE url_code = ? AND (expires_at IS NULL OR expires_at > NOW())",
            [urlCode]
        );
        return rows.length > 0 ? this._mapRow(rows[0]) : null;
    },

    /**
     * Find a URL by its long URL
     * @param {string} longUrl - The original long URL
     * @returns {Promise<Object|null>} The URL object or null if not found
     */
    async findByLongUrl(longUrl) {
        const [rows] = await pool.execute(
            "SELECT * FROM urls WHERE long_url = ?",
            [longUrl]
        );
        return rows.length > 0 ? this._mapRow(rows[0]) : null;
    },

    /**
     * Create a new shortened URL
     * @param {Object} urlData - The URL data to insert
     * @returns {Promise<Object>} The created URL object
     */
    async create(urlData) {
        const { urlCode, longUrl, shortUrl, userId = null, expiresAt = null } = urlData;
        const [result] = await pool.execute(
            `INSERT INTO urls (url_code, long_url, short_url, user_id, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
            [urlCode, longUrl, shortUrl, userId, expiresAt]
        );
        
        // Fetch the actual created record to get accurate timestamps
        const insertId = result.insertId;
        const [rows] = await pool.execute(
            "SELECT * FROM urls WHERE id = ?",
            [insertId]
        );

        if (rows.length === 0) {
            throw new Error("Failed to fetch URL after creation");
        }

        return this._mapRow(rows[0]);
    },

    /**
     * Increment click count and update last accessed time
     * @param {string} urlCode - The short URL code
     * @returns {Promise<void>}
     */
    async incrementClickCount(urlCode) {
        await pool.execute(
            `UPDATE urls 
             SET click_count = click_count + 1, last_accessed_at = CURRENT_TIMESTAMP 
             WHERE url_code = ?`,
            [urlCode]
        );
    },

    /**
     * Find all URLs with optional pagination
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} URLs and pagination info
     */
    async findAll({ page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.execute(
            `SELECT * FROM urls ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[countResult]] = await pool.execute(
            "SELECT COUNT(*) as total FROM urls"
        );

        return {
            urls: rows.map(row => this._mapRow(row)),
            total: countResult.total,
        };
    },

    /**
     * Delete a URL by its code
     * @param {string} urlCode - The short URL code
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async deleteByCode(urlCode) {
        const [result] = await pool.execute(
            "DELETE FROM urls WHERE url_code = ?",
            [urlCode]
        );
        return result.affectedRows > 0;
    },

    /**
     * Map database row to application object
     * @param {Object} row - Database row
     * @returns {Object} Mapped URL object
     */
    _mapRow(row) {
        return {
            id: row.id,
            urlCode: row.url_code,
            longUrl: row.long_url,
            shortUrl: row.short_url,
            clickCount: row.click_count,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastAccessedAt: row.last_accessed_at,
            expiresAt: row.expires_at,
        };
    },
};

module.exports = { URLModel };