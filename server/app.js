const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://stride-forge-six.vercel.app"
];

const corsOptions = {
    origin: (origin, callback) => {
        const isAllowed =
            !origin ||
            allowedOrigins.includes(origin) ||
            /^https:\/\/stride-forge-[a-z0-9]+-rohan4sg\.vercel\.app$/.test(origin);

        if (isAllowed) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/strava", require("./routes/stravaRoutes"));

app.get("/", (req, res) => {
    res.json({
        message: "StrideForge API is running!"
    });
});

module.exports = app;