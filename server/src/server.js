const connect = require('./configs/db');
const app = require('./index');
require("dotenv").config();
const express = require('express');
const PORT = process.env.PORT || 5000;

// Add health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, async () => {
    try {
        await connect();
        console.log(`Server is running on ${PORT}`);

    } catch (error) {
        console.log(error.message);
    }
});