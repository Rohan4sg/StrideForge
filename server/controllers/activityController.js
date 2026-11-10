
const Activity = require("../models/Activity");

// Add a manual running activity
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
        typeof activity_date !== "string" ||
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

        return res.status(201).json({
            message: "Activity saved successfully",
            activityId: activity._id
        });

    } catch (error) {
        console.error("Add activity error:", error);

        return res.status(500).json({
            message: "Failed to save activity"
        });
    }
};

// Fetch paginated running history
exports.getActivities = async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = 10;

        if (!Number.isSafeInteger(page) || page < 1) {
            return res.status(400).json({
                message: "Invalid page number"
            });
        }

        const filter = {
            user_id: req.userId
        };

        const total = await Activity.countDocuments(filter);

        const activities = await Activity.find(filter)
            .sort({
                activity_date: -1,
                createdAt: -1,
                _id: -1
            })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const formattedActivities = activities.map(activity => ({
            ...activity,
            id: activity._id.toString(),
            activity_date: activity.activity_date
                .toISOString()
                .slice(0, 10)
        }));

        return res.json({
            activities: formattedActivities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1
            }
        });

    } catch (error) {
        console.error("Fetch activities error:", error);

        return res.status(500).json({
            message: "Failed to fetch activities"
        });
    }
};

// Fetch recent activity loads for ACWR
exports.getWorkload = async (req, res) => {
    try {
        const today = new Date();

        const currentWeekStart = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate()
        ));

        const day = currentWeekStart.getUTCDay();

        currentWeekStart.setUTCDate(
            currentWeekStart.getUTCDate() -
            (day === 0 ? 6 : day - 1)
        );

        const rangeStart = new Date(currentWeekStart);
        rangeStart.setUTCDate(rangeStart.getUTCDate() - 28);

        const rangeEnd = new Date(currentWeekStart);
        rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 7);

        const activities = await Activity.find({
            user_id: req.userId,
            activity_date: {
                $gte: rangeStart,
                $lt: rangeEnd
            }
        })
            .select("distance activity_date")
            .lean();

        const weeklyLoads = Array(5).fill(0);

        for (const activity of activities) {
            const elapsed =
                activity.activity_date.getTime() -
                currentWeekStart.getTime();

            const weekOffset = Math.floor(
                elapsed / (7 * 24 * 60 * 60 * 1000)
            );

            const index = -weekOffset;

            if (index >= 0 && index < 5) {
                weeklyLoads[index] += Number(activity.distance);
            }
        }

        const acuteLoad = weeklyLoads[0];

        const chronicLoad =
            weeklyLoads.slice(1).reduce(
                (sum, value) => sum + value,
                0
            ) / 4;

        const acwr =
            chronicLoad > 0
                ? acuteLoad / chronicLoad
                : null;

        return res.json({
            acuteLoad,
            chronicLoad,
            acwr,
            weeklyLoads
        });

    } catch (error) {
        console.error("Workload error:", error);

        return res.status(500).json({
            message: "Failed to calculate workload"
        });
    }
};


// Fetch all-time and current-month running statistics
exports.getSummary = async (req, res) => {
    try {
        const now = new Date();

        const monthStart = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1
        ));

        const result = await Activity.aggregate([
            {
                $match: {
                    user_id: new Activity.base.Types.ObjectId(req.userId)
                }
            },
            {
                $facet: {
                    allTime: [
                        {
                            $group: {
                                _id: null,
                                totalActivities: { $sum: 1 },
                                totalDistance: { $sum: "$distance" },
                                totalDuration: { $sum: "$duration" }
                            }
                        }
                    ],
                    thisMonth: [
                        {
                            $match: {
                                activity_date: { $gte: monthStart }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalActivities: { $sum: 1 },
                                totalDistance: { $sum: "$distance" },
                                totalDuration: { $sum: "$duration" }
                            }
                        }
                    ]
                }
            }
        ]);

        const formatStats = (data) => {
            const stats = data[0] || {
                totalActivities: 0,
                totalDistance: 0,
                totalDuration: 0
            };

            return {
                totalActivities: stats.totalActivities,
                totalDistance: Number(stats.totalDistance.toFixed(2)),
                totalDuration: Number(stats.totalDuration.toFixed(2)),
                averagePace: stats.totalDistance > 0
                    ? Number((stats.totalDuration / stats.totalDistance).toFixed(2))
                    : null
            };
        };

        return res.json({
            allTime: formatStats(result[0].allTime),
            thisMonth: formatStats(result[0].thisMonth)
        });

    } catch (error) {
        console.error("Summary error:", error);

        return res.status(500).json({
            message: "Failed to calculate running statistics"
        });
    }
};
