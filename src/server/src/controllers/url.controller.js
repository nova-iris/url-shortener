const express = require("express");
const router = express.Router();
const validUrl = require("valid-url");
const shortid = require("shortid");
const { URLModel } = require("../models/url.model");
const { generateShortId } = require("../utils");

const baseUrl = process.env.BASEURI;

class HttpError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
    }
}

const generateUniqueShortId = async () => {
    let shortId;
    let existingURL;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (attempts < MAX_ATTEMPTS) {
        shortId = generateShortId();
        existingURL = await URLModel.findOne({ urlCode: shortId });

        if (!existingURL) {
            return shortId;
        }
        attempts++;
    }

    throw new HttpError("Failed to generate unique short ID after multiple attempts", 500);
};

// Middleware for URL controller error handling
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/shorten", asyncHandler(async (req, res) => {
    const { longUrl, urlCode } = req.body;

    // Validate required fields
    if (!longUrl) {
        throw new HttpError("URL is required", 400);
    }

    // Validate URL format
    if (!validUrl.isUri(longUrl)) {
        throw new HttpError("Invalid URL format", 400);
    }

    // Validate custom code if provided
    if (urlCode) {
        // Check if code follows allowed pattern
        if (!/^[a-zA-Z0-9_-]+$/.test(urlCode)) {
            throw new HttpError("Custom code can only contain letters, numbers, hyphens, and underscores", 400);
        }

        // Check if code is already in use
        const existingCodeBookmark = await URLModel.findOne({ urlCode });
        if (existingCodeBookmark) {
            throw new HttpError(`Code "${urlCode}" already in use. Please choose a different code.`, 400);
        }
    }

    // Check for existing URL to avoid duplicates
    const existingURL = await URLModel.findOne({ longUrl });
    if (existingURL && !urlCode) {
        return res.json({
            urlCode: existingURL.urlCode,
            shortUrl: existingURL.shortUrl,
            isExisting: true
        });
    }

    // Generate or use provided code
    const generatedCode = urlCode || await generateUniqueShortId();
    const shortUrl = `${baseUrl}/${generatedCode}`;

    // Create new shortened URL
    const newURL = new URLModel({
        urlCode: generatedCode,
        longUrl,
        shortUrl,
        createdAt: new Date()
    });

    await newURL.save();

    res.status(201).json({
        urlCode: generatedCode,
        shortUrl: shortUrl,
        isExisting: false
    });
}));

// Get all URLs (with optional pagination)
router.get("/", asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const urls = await URLModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await URLModel.countDocuments();

    res.json({
        urls,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
}));

module.exports = router;