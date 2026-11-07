
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://stride-forge-six.vercel.app"
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

// Running activity routes
app.use("/api/activities", require("./routes/activityRoutes"));

// Strava routes
app.use("/api/strava", require("./routes/stravaRoutes"));

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "StrideForge API is running!"
    });
});

module.exports = app;
