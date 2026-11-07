
const StravaAccount = require("../models/StravaAccount");
const Activity = require("../models/Activity");

const API_URL = "https://www.strava.com/api/v3";

// Get a valid Strava access token
const getValidAccessToken = async (account) => {
    const now = Math.floor(Date.now() / 1000);

    if (account.expires_at > now + 300) {
        return account.access_token;
    }

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
                grant_type: "refresh_token",
                refresh_token: account.refresh_token
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Unable to refresh Strava token"
        );
    }

    account.access_token = data.access_token;
    account.refresh_token = data.refresh_token;
    account.expires_at = data.expires_at;

    await account.save();

    return account.access_token;
};

// Check whether an activity is a run
const isRunningActivity = (item) => {
    return (
        item.type === "Run" ||
        item.sport_type === "Run" ||
        item.sport_type === "TrailRun"
    );
};

// Save or update a Strava running activity
const saveStravaActivity = async (userId, item) => {
    const externalId = String(item.id);

    const filter = {
        user_id: userId,
        source: "strava",
        external_activity_id: externalId
    };

    if (!isRunningActivity(item)) {
        await Activity.deleteOne(filter);
        return "skipped";
    }

    const distance = Number(item.distance) / 1000;
    const duration = Number(item.moving_time) / 60;

    const dateString = (
        item.start_date_local || item.start_date || ""
    ).slice(0, 10);

    const activityDate = new Date(
        `${dateString}T00:00:00.000Z`
    );

    if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        distance <= 0 ||
        duration <= 0 ||
        Number.isNaN(activityDate.getTime())
    ) {
        return "skipped";
    }

    const existing = await Activity.findOne(filter);

    await Activity.findOneAndUpdate(
        filter,
        {
            $set: {
                user_id: userId,
                distance,
                duration,
                activity_date: activityDate,
                source: "strava",
                external_activity_id: externalId
            }
        },
        {
            upsert: true,
            returnDocument: "after",
            runValidators: true
        }
    );

    return existing ? "updated" : "imported";
};

// Manual Strava synchronization
const syncStravaActivities = async (userId) => {
    const account = await StravaAccount.findOne({
        user_id: userId
    });

    if (!account) {
        throw new Error("Strava account is not connected");
    }

    const accessToken = await getValidAccessToken(account);

    let page = 1;
    let imported = 0;
    let updated = 0;

    while (true) {
        const response = await fetch(
            `${API_URL}/athlete/activities?per_page=100&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Strava activity fetch failed: ${response.status}`
            );
        }

        const activities = await response.json();

        if (!Array.isArray(activities)) {
            throw new Error("Invalid Strava response");
        }

        if (activities.length === 0) {
            break;
        }

        for (const item of activities) {
            const result = await saveStravaActivity(userId, item);

            if (result === "imported") imported++;
            if (result === "updated") updated++;
        }

        if (activities.length < 100) {
            break;
        }

        page++;
    }

    return { imported, updated };
};

// Process a Strava webhook event
const processStravaWebhookEvent = async (event) => {
    const athleteId = String(event.owner_id);

    const account = await StravaAccount.findOne({
        athlete_id: athleteId
    });

    if (!account) {
        console.log("Webhook ignored: athlete not connected");
        return;
    }

    // Athlete revoked StrideForge access
    if (
        event.object_type === "athlete" &&
        event.aspect_type === "update" &&
        event.updates?.authorized === "false"
    ) {
        await StravaAccount.deleteOne({
            _id: account._id
        });

        console.log("Strava account disconnected");
        return;
    }

    if (event.object_type !== "activity") {
        return;
    }

    const externalId = String(event.object_id);

    const filter = {
        user_id: account.user_id,
        source: "strava",
        external_activity_id: externalId
    };

    // Remove deleted activities
    if (event.aspect_type === "delete") {
        await Activity.deleteOne(filter);
        console.log("Strava activity deleted:", externalId);
        return;
    }

    if (
        event.aspect_type !== "create" &&
        event.aspect_type !== "update"
    ) {
        return;
    }

    const accessToken = await getValidAccessToken(account);

    const response = await fetch(
        `${API_URL}/activities/${externalId}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    // Retry potentially temporary activity availability errors
    if (response.status === 404) {
        throw new Error(
            `Strava activity ${externalId} is not available yet (404)`
        );
    }

    if (!response.ok) {
        throw new Error(
            `Strava webhook fetch failed: ${response.status}`
        );
    }

    const activity = await response.json();

    const result = await saveStravaActivity(
        account.user_id,
        activity
    );

    console.log(
        `Strava webhook processed: ${externalId} (${result})`
    );
};

module.exports = {
    syncStravaActivities,
    processStravaWebhookEvent
};
