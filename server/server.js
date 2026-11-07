
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const {
    startWebhookWorker
} = require("./services/webhookWorker");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        // Start persistent Strava webhook processor
        startWebhookWorker();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`StrideForge running on port ${PORT}`);
        });

    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();
