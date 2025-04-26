const mongoose = require("mongoose");
const dbConfig = require("./dbConfig");

const connect = () => {
    return mongoose.connect(dbConfig.url, dbConfig.options)
        .then(() => {
            console.log('Successfully connected to MongoDB.');
        })
        .catch((error) => {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        });
};

module.exports = connect;