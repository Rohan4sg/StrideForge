
const jwt = require("jsonwebtoken");

const StravaAccount = require("../models/StravaAccount");
const StravaWebhookEvent = require("../models/StravaWebhookEvent");

const {
    syncStravaActivities
} = require("../services/stravaService");

const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:5173";

// Generate Strava authorization URL
exports.connectStrava = async (req, res) => {
    try {
        const state = jwt.sign(
            { userId: req.userId },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        const params = new URLSearchParams({
            client_id: process.env.STRAVA_CLIENT_ID,
            redirect_uri: process.env.STRAVA_REDIRECT_URI,
            response_type: "code",
            approval_prompt: "auto",
            scope: "read,activity:read_all",
            state
        });

        const authUrl =
            `https://www.strava.com/oauth/authorize?${params.toString()}`;

        res.json({ url: authUrl });

    } catch (error) {
        console.error("Strava connection error:", error);

        res.status(500).json({
            message: "Unable to connect Strava"
        });
    }
};

// Handle Strava authorization callback
exports.stravaCallback = async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(
            `${FRONTEND_URL}/dashboard?strava=denied`
        );
    }

    if (!code || !state) {
        return res.status(400).send(
            "Missing authorization details"
        );
    }

    try {
        const decoded = jwt.verify(
            state,
            process.env.JWT_SECRET
        );

        const response = await fetch(
            "https://www.strava.com/oauth/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    client_id: process.env.STRAVA_CLIENT_ID,
                    client_secret: process.env.STRAVA_CLIENT_SECRET,
                    code,
                    grant_type: "authorization_code"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
    console.error("Strava token exchange failed:", {
        status: response.status,
        message: data.message,
        errors: data.errors
    });

    throw new Error(
        data.message || "Strava token exchange failed"
    );
}

        await StravaAccount.findOneAndUpdate(
            { user_id: decoded.userId },
            {
                user_id: decoded.userId,
                athlete_id: String(data.athlete.id),
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: data.expires_at,
                scope: data.scope || ""
            },
            {
                upsert: true,
                returnDocument: "after",
                runValidators: true
            }
        );

        return res.redirect(
            `${FRONTEND_URL}/dashboard?strava=connected`
        );

    } catch (error) {
        console.error("Strava callback error:", error);

        return res.status(400).send(
            "Strava authorization failed. Please try connecting again."
        );
    }
};

// Manually synchronize Strava activities
exports.syncActivities = async (req, res) => {
    try {
        const result = await syncStravaActivities(req.userId);

        res.json({
            message: "Strava synchronization completed successfully",
            imported: result.imported,
            updated: result.updated
        });

    } catch (error) {
        console.error("Strava sync error:", error);

        res.status(500).json({
            message: error.message ||
                "Strava synchronization failed"
        });
    }
};

// Check Strava connection status
exports.getConnectionStatus = async (req, res) => {
    try {
        const account = await StravaAccount.findOne({
            user_id: req.userId
        }).select("athlete_id expires_at scope createdAt");

        if (!account) {
            return res.json({
                connected: false
            });
        }

        return res.json({
            connected: true,
            athlete_id: account.athlete_id,
            expires_at: account.expires_at,
            scope: account.scope,
            connected_at: account.createdAt
        });

    } catch (error) {
        console.error("Strava status error:", error);

        return res.status(500).json({
            message: "Unable to fetch Strava connection status"
        });
    }
};

// Verify Strava webhook subscription
exports.handleWebhookVerification = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
        mode === "subscribe" &&
        token &&
        token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN &&
        challenge
    ) {
        console.log("Strava webhook verification successful");

        return res.status(200).json({
            "hub.challenge": challenge
        });
    }

    return res.sendStatus(403);
};

// Receive and persist Strava webhook events
exports.handleWebhookEvent = async (req, res) => {
    try {
        const event = req.body;

        if (
            !event ||
            !event.object_type ||
            !event.aspect_type ||
            event.object_id == null ||
            event.owner_id == null ||
            event.event_time == null ||
            event.subscription_id == null
        ) {
            return res.status(400).json({
                message: "Invalid Strava webhook event"
            });
        }

        const eventKey = [
            event.subscription_id,
            event.owner_id,
            event.object_type,
            event.object_id,
            event.aspect_type,
            event.event_time
        ].join("_");

        await StravaWebhookEvent.updateOne(
            { event_key: eventKey },
            {
                $setOnInsert: {
                    event_key: eventKey,
                    event_data: event,
                    status: "pending",
                    attempts: 0,
                    next_attempt_at: new Date()
                }
            },
            { upsert: true }
        );

        return res.status(200).send("EVENT_RECEIVED");

    } catch (error) {
        console.error(
            "Webhook storage error:",
            error.message
        );

        return res.status(500).send(
            "Unable to store event"
        );
    }
};
