const mongoose = require("mongoose");
const fs = require("fs");

const connect = async () => {
    try {
        const username = encodeURIComponent(fs.readFileSync("/run/secrets/mongo_root_username", "utf8").trim());
        const password = encodeURIComponent(fs.readFileSync("/run/secrets/mongo_root_password", "utf8").trim());

        const uri = `mongodb://${username}:${password}@mongo:27017/urlshortener?authSource=admin`;

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