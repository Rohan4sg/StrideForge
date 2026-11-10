
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

function Strava() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connectLoading, setConnectLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const status = searchParams.get("strava");

        if (status === "connected") {
            setMessage("Strava connected successfully!");
        } else if (status === "denied") {
            setMessage("Strava connection was cancelled.");
        } else if (status === "already-connected") {
            setMessage("This StrideForge account already has another Strava account connected.");
        }

        if (status) {
            setSearchParams({}, { replace: true });
        }

        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await api.get("/strava/status");
            setConnected(response.data.connected);
        } catch (error) {
            console.error("Strava status error:", error);
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setConnectLoading(true);
        setMessage("");

        try {
            const response = await api.get("/strava/connect");

            if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                setMessage("Unable to generate Strava authorization URL.");
                setConnectLoading(false);
            }
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to connect to Strava."
            );
            setConnectLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncLoading(true);
        setMessage("");

        try {
            const response = await api.post("/strava/sync");

            setMessage(
                `${response.data.message}. Imported: ${response.data.imported}, Updated: ${response.data.updated}.`
            );
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Strava synchronization failed."
            );
        } finally {
            setSyncLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <section className="panel">
                <h2>Strava Integration</h2>

                <p>
                    Connect your Strava account and synchronize
                    your running activities with StrideForge.
                </p>

                {loading ? (
                    <p>Checking Strava connection...</p>
                ) : connected ? (
                    <>
                        <p><strong>● Connected</strong></p>

                        <button
                            type="button"
                            onClick={handleSync}
                            disabled={syncLoading}
                        >
                            {syncLoading
                                ? "Synchronizing..."
                                : "Sync Strava Activities"}
                        </button>
                    </>
                ) : (
                    <>
                        <p><strong>● Disconnected</strong></p>

                        <button
                            type="button"
                            onClick={handleConnect}
                            disabled={connectLoading}
                        >
                            {connectLoading
                                ? "Connecting..."
                                : "Connect with Strava"}
                        </button>
                    </>
                )}

                {message && (
                    <p className="message">{message}</p>
                )}
            </section>
        </div>
    );
}

export default Strava;
