const router = require('express').Router();
const { URLModel } = require('../models/url.model');

// Reuse the HttpError class for consistent error handling
class HttpError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
    }
}

// Middleware for async error handling
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Route for redirection based on short code
router.get('/:code', asyncHandler(async (req, res) => {
    const { code } = req.params;

    // Validate the code parameter
    if (!code || typeof code !== 'string') {
        throw new HttpError('Invalid URL code format', 400);
    }

    // Find the URL in the database
    const url = await URLModel.findOne({ urlCode: code });

    // If URL exists, return it
    if (url) {
        // Log the access (could be expanded to track analytics)
        console.log(`${new Date().toISOString()} - Redirect request for code: ${code} -> ${url.longUrl}`);
        return res.json({ longUrl: url.longUrl });
    }

    // If URL doesn't exist, return 404
    throw new HttpError(`No URL found for code: ${code}`, 404);
}));

module.exports = router;