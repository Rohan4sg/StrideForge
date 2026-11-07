
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    connectStrava,
    stravaCallback,
    syncActivities
} = require("../controllers/stravaController");

// Connect Strava account
router.get("/connect", authMiddleware, connectStrava);

// Strava OAuth callback
router.get("/callback", stravaCallback);

// Synchronize Strava activities
router.post("/sync", authMiddleware, syncActivities);

module.exports = router;
