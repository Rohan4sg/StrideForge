const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

// Running activity routes
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/strava", require("./routes/stravaRoutes"));

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to StrideForge API!",
        status: "Running"
    });
});

module.exports = app;