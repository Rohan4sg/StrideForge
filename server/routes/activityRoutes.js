
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    addActivity,
    getActivities,
    getWorkload
} = require("../controllers/activityController");

router.post("/", authMiddleware, addActivity);

router.get("/", authMiddleware, getActivities);

router.get("/workload", authMiddleware, getWorkload);

module.exports = router;
