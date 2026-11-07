const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    addActivity,
    getActivities
} = require("../controllers/activityController");

router.post("/", authMiddleware, addActivity);
router.get("/", authMiddleware, getActivities);

module.exports = router;