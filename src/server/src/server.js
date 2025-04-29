const express = require("express");
const cors = require("cors");
const connect = require("./configs/db");
const urlRouter = require("./controllers/url.controller");
const redirectRouter = require("./controllers/redirects.controller");

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json("OK");
});

// Add API prefix to URL routes
app.use("/api/url", urlRouter);
app.use("/", redirectRouter);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: "Not found",
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(`${new Date().toISOString()} - Error: ${err.message}`);
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.name || "Internal Server Error",
        message: err.message || "An unexpected error occurred",
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

const port = process.env.PORT || 5000;

// Graceful shutdown handling
const server = app.listen(port, () => {
    console.log(`${new Date().toISOString()} - Server is running on port ${port}`);
});

// Handle MongoDB connection
connect().catch(err => {
    console.error(`${new Date().toISOString()} - Database connection error:`, err);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log(`${new Date().toISOString()} - SIGTERM signal received. Closing server...`);
    server.close(() => {
        console.log(`${new Date().toISOString()} - Server closed.`);
        process.exit(0);
    });
});