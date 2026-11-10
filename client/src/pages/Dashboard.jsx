
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
    const [summary, setSummary] = useState({
        allTime: {
            totalActivities: 0,
            totalDistance: 0,
            totalDuration: 0,
            averagePace: null
        },
        thisMonth: {
            totalActivities: 0,
            totalDistance: 0,
            totalDuration: 0,
            averagePace: null
        }
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await api.get("/activities/summary");
                setSummary(response.data);
            } catch (error) {
                console.error("Summary loading error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const renderStats = (stats) => (
        <div className="acwr-grid">
            <div className="acwr-item">
                <span>Total Activities</span>
                <h3>{stats.totalActivities}</h3>
            </div>

            <div className="acwr-item">
                <span>Total Distance</span>
                <h3>{Number(stats.totalDistance).toFixed(2)} km</h3>
            </div>

            <div className="acwr-item">
                <span>Running Duration</span>
                <h3>{Number(stats.totalDuration).toFixed(2)} min</h3>
            </div>

            <div className="acwr-item">
                <span>Average Pace</span>
                <h3>
                    {stats.averagePace !== null
                        ? `${Number(stats.averagePace).toFixed(2)} min/km`
                        : "--"}
                </h3>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <h1>Overview</h1>
            <p>Your running performance at a glance.</p>

            {loading ? (
                <p>Loading statistics...</p>
            ) : (
                <>
                    <section className="panel">
                        <h2>All-Time Performance</h2>
                        <p>Your complete running statistics.</p>
                        {renderStats(summary.allTime)}
                    </section>

                    <section className="panel">
                        <h2>This Month</h2>
                        <p>Your running statistics for the current month.</p>
                        {renderStats(summary.thisMonth)}
                    </section>
                </>
            )}
        </div>
    );
}

export default Dashboard;
