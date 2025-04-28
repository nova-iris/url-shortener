const mongoose = require("mongoose");
const fs = require("fs");

const connect = async () => {
    try {
        let username, password;

        // Try to get credentials from environment variables first (preferred method)
        if (process.env.MONGO_INITDB_ROOT_USERNAME && process.env.MONGO_INITDB_ROOT_PASSWORD) {
            username = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME);
            password = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD);
            console.log("Using MongoDB credentials from environment variables");
        } else {
            // Fall back to Docker secrets if available
            try {
                username = encodeURIComponent(fs.readFileSync("/run/secrets/mongo_root_username", "utf8").trim());
                password = encodeURIComponent(fs.readFileSync("/run/secrets/mongo_root_password", "utf8").trim());
                console.log("Using MongoDB credentials from Docker secrets");
            } catch (secretErr) {
                // Final fallback to default values (for development only)
                username = encodeURIComponent("admin");
                password = encodeURIComponent("password");
                console.log("Warning: Using default MongoDB credentials - not secure for production");
            }
        }

        // Get MongoDB connection details from environment variables with defaults
        const host = process.env.MONGODB_HOST || "mongo";
        const port = process.env.MONGODB_PORT || "27017";
        const database = process.env.MONGODB_DATABASE || "urlshortener";

        const uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("Connected to MongoDB successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};

module.exports = connect;