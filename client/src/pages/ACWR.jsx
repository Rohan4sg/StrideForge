
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Dashboard.css";

function ACWR() {
    const [workload, setWorkload] = useState({
        acuteLoad: 0,
        chronicLoad: 0,
        acwr: null
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorkload = async () => {
            try {
                const response = await api.get("/activities/workload");
                setWorkload(response.data);
            } catch (error) {
                console.error("Workload fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkload();
    }, []);

    const acuteLoad = Number(workload.acuteLoad || 0);
    const chronicLoad = Number(workload.chronicLoad || 0);
    const acwr = workload.acwr;

    const getStatus = () => {
        if (chronicLoad === 0) {
            return {
                status: "Insufficient Data",
                description: "Previous four weeks of running data are required.",
                className: "neutral"
            };
        }

        if (acwr < 0.8) {
            return {
                status: "Low Workload",
                description: "Your current workload is below your recent baseline.",
                className: "low"
            };
        }

        if (acwr <= 1.3) {
            return {
                status: "Balanced Workload",
                description: "Your workload is within the selected monitoring range.",
                className: "balanced"
            };
        }

        if (acwr <= 1.5) {
            return {
                status: "Elevated Workload",
                description: "Your workload has increased. Monitor recovery and fatigue.",
                className: "elevated"
            };
        }

        return {
            status: "High Workload",
            description: "Your workload is substantially above your recent baseline.",
            className: "high"
        };
    };

    const status = getStatus();

    return (
        <div className="dashboard">
            <section className="panel">
                <h2>ACWR Monitoring</h2>
                <p>Acute-to-Chronic Workload Ratio</p>

                {loading ? (
                    <p>Loading workload data...</p>
                ) : (
                    <>
                        <div className="acwr-grid">
                            <div className="acwr-item">
                                <span>Acute Load</span>
                                <h3>{acuteLoad.toFixed(2)} km</h3>
                                <small>Current week</small>
                            </div>

                            <div className="acwr-item">
                                <span>Chronic Load</span>
                                <h3>{chronicLoad.toFixed(2)} km</h3>
                                <small>Previous four-week average</small>
                            </div>

                            <div className="acwr-item">
                                <span>ACWR</span>
                                <h3>
                                    {acwr !== null
                                        ? Number(acwr).toFixed(2)
                                        : "--"}
                                </h3>
                                <small>Acute / Chronic</small>
                            </div>
                        </div>

                        <div className={`acwr-status ${status.className}`}>
                            <h3>{status.status}</h3>
                            <p>{status.description}</p>
                        </div>

                        <p className="acwr-note">
                            ACWR is a training-load monitoring indicator.
                            It cannot independently predict or diagnose injuries.
                        </p>
                    </>
                )}
            </section>
        </div>
    );
}

export default ACWR;