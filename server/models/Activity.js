
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        distance: {
            type: Number,
            required: true,
            min: 0.01
        },
        duration: {
            type: Number,
            required: true,
            min: 0.01
        },
        activity_date: {
            type: Date,
            required: true
        },
        source: {
            type: String,
            enum: ["manual", "strava"],
            default: "manual"
        },
        external_activity_id: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

activitySchema.index(
    { user_id: 1, external_activity_id: 1 },
    {
        unique: true,
        partialFilterExpression: {
            external_activity_id: { $type: "string" }
        }
    }
);

module.exports = mongoose.model("Activity", activitySchema);