const config = {
    development: {
        url: `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGODB_HOST || 'localhost'}:27017/urlshortener?authSource=admin`,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    },
    production: {
        url: process.env.DB_URL,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    }
};

module.exports = config[process.env.NODE_ENV || 'development'];