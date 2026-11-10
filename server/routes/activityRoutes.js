
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    addActivity,
    getActivities,
    getWorkload,
    getSummary
} = require("../controllers/activityController");

// Add a running activity
router.post("/", authMiddleware, addActivity);

// Fetch paginated running history
router.get("/", authMiddleware, getActivities);

// Fetch ACWR workload data
router.get("/workload", authMiddleware, getWorkload);

// Fetch all-time and current-month statistics
router.get("/summary", authMiddleware, getSummary);

module.exports = router;
