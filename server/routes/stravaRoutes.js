
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    connectStrava,
    stravaCallback,
    syncActivities,
    handleWebhookVerification,
    handleWebhookEvent
} = require("../controllers/stravaController");

// Connect Strava account
router.get("/connect", authMiddleware, connectStrava);

// Strava OAuth callback
router.get("/callback", stravaCallback);

// Manual activity synchronization
router.post("/sync", authMiddleware, syncActivities);

// Strava webhook verification (public endpoint)
router.get("/webhook", handleWebhookVerification);

// Strava webhook event receiver (public endpoint)
router.post("/webhook", handleWebhookEvent);

module.exports = router;
