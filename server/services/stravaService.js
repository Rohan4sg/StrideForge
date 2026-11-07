
const StravaAccount = require("../models/StravaAccount");
const Activity = require("../models/Activity");

// Get a valid Strava access token
const getValidAccessToken = async (account) => {
    const now = Math.floor(Date.now() / 1000);

    // Reuse token if it has more than 5 minutes remaining
    if (account.expires_at > now + 300) {
        return account.access_token;
    }

    // Refresh expired or nearly expired token
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

// Fetch and save running activities
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
            `https://www.strava.com/api/v3/athlete/activities?per_page=100&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const activities = await response.json();

        if (!response.ok) {
            throw new Error(
                activities.message || "Unable to fetch Strava activities"
            );
        }

        if (activities.length === 0) {
            break;
        }

        for (const item of activities) {

            // Import running activities only
            if (
                item.type !== "Run" &&
                item.sport_type !== "Run" &&
                item.sport_type !== "TrailRun"
            ) {
                continue;
            }

            const externalId = String(item.id);

            const existingActivity = await Activity.findOne({
                user_id: userId,
                external_activity_id: externalId
            });

            const activityDate = (
                item.start_date_local || item.start_date
            ).slice(0, 10);

            const activityData = {
                user_id: userId,
                distance: Number(item.distance) / 1000,
                duration: Number(item.moving_time) / 60,
                activity_date: new Date(
                    `${activityDate}T00:00:00.000Z`
                ),
                source: "strava",
                external_activity_id: externalId
            };

            await Activity.findOneAndUpdate(
                {
                    user_id: userId,
                    external_activity_id: externalId
                },
                {
                    $set: activityData
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );

            if (existingActivity) {
                updated++;
            } else {
                imported++;
            }
        }

        if (activities.length < 100) {
            break;
        }

        page++;
    }

    return {
        imported,
        updated
    };
};

module.exports = {
    syncStravaActivities
};
