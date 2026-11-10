
const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true
        },
        password_hash: {
            type: String,
            required: true
        },
        otp_hash: {
            type: String,
            required: true
        },
        expires_at: {
            type: Date,
            required: true
        },
        attempts: {
            type: Number,
            default: 0
        },
        last_sent_at: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Automatically clean up expired verification records.
emailVerificationSchema.index(
    { expires_at: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "EmailVerification",
    emailVerificationSchema
);
