const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const urlController = require('./controllers/url.controller');
const redirectController = require('./controllers/redirects.controller');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:80',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json());

// Routes
app.use('/', urlController);
app.use('/', redirectController);

module.exports = app;