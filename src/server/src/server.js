const express = require("express");
const cors = require("cors");
const { connect, close } = require("./configs/db");
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
let server;

// Start server after database connection
const startServer = async () => {
    try {
        // Connect to database and initialize schema
        await connect();

        // Start listening
        server = app.listen(port, () => {
            console.log(`${new Date().toISOString()} - Server is running on port ${port}`);
        });
    } catch (err) {
        console.error(`${new Date().toISOString()} - Failed to start server:`, err);
        process.exit(1);
    }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`${new Date().toISOString()} - ${signal} signal received. Closing server...`);

    if (server) {
        server.close(async () => {
            console.log(`${new Date().toISOString()} - HTTP server closed.`);
            try {
                await close();
                console.log(`${new Date().toISOString()} - Database connection closed.`);
                process.exit(0);
            } catch (err) {
                console.error(`${new Date().toISOString()} - Error during shutdown:`, err);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();