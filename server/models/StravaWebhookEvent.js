
const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
    {
        event_key: {
            type: String,
            required: true,
            unique: true
        },
        event_data: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "processing", "processed", "failed"],
            default: "pending"
        },
        attempts: {
            type: Number,
            default: 0
        },
        last_error: {
            type: String,
            default: null
        },
        next_attempt_at: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

webhookEventSchema.index({ status: 1, next_attempt_at: 1 });

module.exports = mongoose.model(
    "StravaWebhookEvent",
    webhookEventSchema
);
