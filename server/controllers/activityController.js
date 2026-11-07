
const Activity = require("../models/Activity");

exports.addActivity = async (req, res) => {
    const { distance, duration, activity_date } = req.body;

    if (!distance || !duration || !activity_date) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    if (
        !Number.isFinite(Number(distance)) ||
        !Number.isFinite(Number(duration)) ||
        Number(distance) <= 0 ||
        Number(duration) <= 0
    ) {
        return res.status(400).json({
            message: "Distance and duration must be positive numbers"
        });
    }

    const parsedDate = new Date(`${activity_date}T00:00:00.000Z`);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(activity_date) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== activity_date
    ) {
        return res.status(400).json({
            message: "Please provide a valid activity date"
        });
    }

    try {
        const activity = await Activity.create({
            user_id: req.userId,
            distance: Number(distance),
            duration: Number(duration),
            activity_date: parsedDate,
            source: "manual"
        });

        res.status(201).json({
            message: "Activity saved successfully",
            activityId: activity._id
        });

    } catch (error) {
        console.error("Add activity error:", error);

        res.status(500).json({
            message: "Failed to save activity"
        });
    }
};

exports.getActivities = async (req, res) => {
    try {
        const activities = await Activity.find({
            user_id: req.userId
        })
            .sort({
                activity_date: -1,
                createdAt: -1
            })
            .lean();

        const formattedActivities = activities.map(activity => ({
            ...activity,
            id: activity._id.toString(),
            activity_date: activity.activity_date
                .toISOString()
                .slice(0, 10)
        }));

        res.json(formattedActivities);

    } catch (error) {
        console.error("Fetch activities error:", error);

        res.status(500).json({
            message: "Failed to fetch activities"
        });
    }
};
