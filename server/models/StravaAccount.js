
const mongoose = require("mongoose");

const stravaAccountSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        athlete_id: {
            type: String,
            required: true,
            unique: true
        },

        access_token: {
            type: String,
            required: true
        },

        refresh_token: {
            type: String,
            required: true
        },

        expires_at: {
            type: Number,
            required: true
        },

        scope: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "StravaAccount",
    stravaAccountSchema
);
