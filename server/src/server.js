const express = require("express");
const cors = require("cors");
const connect = require("./configs/db");
const urlRouter = require("./controllers/url.controller");
const redirectRouter = require("./controllers/redirects.controller");

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json("OK");
});

// Add API prefix to URL routes
app.use("/api/url", urlRouter);
app.use("/", redirectRouter);

const port = process.env.PORT || 5000;

connect();

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});