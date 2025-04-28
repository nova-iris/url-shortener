const mongoose = require("mongoose");
// Use dotenv to load environment variables if available
require('dotenv').config();

const connect = async () => {
    try {
        // Get environment variables with fallback values
        const username = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME || 'admin');
        const password = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD || '');
        const host = process.env.MONGODB_HOST || 'mongo';
        const port = process.env.MONGODB_PORT || '27017';
        const dbName = process.env.MONGODB_DATABASE || 'urlshortener';

        // Construct the MongoDB connection URI
        const uri = `mongodb://${username}:${password}@${host}:${port}/${dbName}?authSource=admin`;

        // Log connection attempt (without credentials)
        console.log(`Connecting to MongoDB at ${host}:${port}/${dbName}`);

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};

module.exports = connect;