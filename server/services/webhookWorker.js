
const StravaWebhookEvent = require("../models/StravaWebhookEvent");

const {
    processStravaWebhookEvent
} = require("./stravaService");

const MAX_ATTEMPTS = 5;
const RETRY_DELAY = 30000;
const POLL_INTERVAL = 10000;
const PROCESSING_TIMEOUT = 120000;

let workerRunning = false;
let workerStarted = false;

// Find and atomically claim the next available event
const claimNextEvent = async () => {
    const now = new Date();
    const staleTime = new Date(
        now.getTime() - PROCESSING_TIMEOUT
    );

    return StravaWebhookEvent.findOneAndUpdate(
        {
            $or: [
                {
                    status: "pending",
                    next_attempt_at: { $lte: now }
                },
                {
                    status: "failed",
                    next_attempt_at: { $lte: now },
                    attempts: { $lt: MAX_ATTEMPTS }
                },
                {
                    status: "processing",
                    updatedAt: { $lte: staleTime },
                    attempts: { $lt: MAX_ATTEMPTS }
                }
            ]
        },
        {
            $set: {
                status: "processing"
            },
            $inc: {
                attempts: 1
            }
        },
        {
            returnDocument: "after",
            sort: { createdAt: 1 }
        }
    );
};

// Process one event
const processNextEvent = async () => {
    const event = await claimNextEvent();

    if (!event) {
        return false;
    }

    try {
        await processStravaWebhookEvent(event.event_data);

        await StravaWebhookEvent.updateOne(
            { _id: event._id },
            {
                $set: {
                    status: "processed",
                    last_error: null
                }
            }
        );

        console.log(
            "Webhook event processed:",
            event.event_key
        );

    } catch (error) {
        const permanentlyFailed =
            event.attempts >= MAX_ATTEMPTS;

        const nextAttempt = new Date(
            Date.now() + RETRY_DELAY * event.attempts
        );

        await StravaWebhookEvent.updateOne(
            { _id: event._id },
            {
                $set: {
                    status: permanentlyFailed
                        ? "failed"
                        : "pending",
                    next_attempt_at: nextAttempt,
                    last_error: error.message
                }
            }
        );

        console.error(
            "Webhook event processing failed:",
            event.event_key,
            error.message,
            permanentlyFailed
                ? "(maximum attempts reached)"
                : "(retry scheduled)"
        );
    }

    return true;
};

// Background worker
const runWorker = async () => {
    if (workerRunning) {
        return;
    }

    workerRunning = true;

    try {
        await processNextEvent();
    } catch (error) {
        console.error(
            "Webhook worker error:",
            error.message
        );
    } finally {
        workerRunning = false;
    }
};

// Start worker after MongoDB connects
const startWebhookWorker = () => {
    if (workerStarted) {
        return;
    }

    workerStarted = true;

    console.log("StrideForge webhook worker started");

    runWorker();

    setInterval(runWorker, POLL_INTERVAL);
};

module.exports = {
    startWebhookWorker
};
