
const jwt = require("jsonwebtoken");
const StravaAccount = require("../models/StravaAccount");
const { syncStravaActivities } = require("../services/stravaService");

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
            "http://localhost:5173/dashboard?strava=denied"
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
                new: true,
                runValidators: true
            }
        );

        res.redirect(
            "http://localhost:5173/dashboard?strava=connected"
        );

    } catch (error) {
        console.error("Strava callback error:", error);

        res.status(400).send(
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
            message: error.message || "Strava synchronization failed"
        });
    }
};
