
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://stride-forge-six.vercel.app",
    "https://stride-forge-91nsarru4-rohan4sg.vercel.app"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (
            !origin ||
            allowedOrigins.includes(origin)
        ) {
            return callback(null, true);
        }

        return callback(
            new Error("Origin not allowed by CORS")
        );
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

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
