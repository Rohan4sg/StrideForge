
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    connectStrava,
    stravaCallback,
    syncActivities,
    getConnectionStatus,
    handleWebhookVerification,
    handleWebhookEvent
} = require("../controllers/stravaController");

router.get("/connect", authMiddleware, connectStrava);
router.get("/callback", stravaCallback);

router.get("/status", authMiddleware, getConnectionStatus);

router.post("/sync", authMiddleware, syncActivities);

router.get("/webhook", handleWebhookVerification);
router.post("/webhook", handleWebhookEvent);

module.exports = router;
