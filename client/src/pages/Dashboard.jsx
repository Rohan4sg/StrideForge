
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const navigate = useNavigate();

    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [activityDate, setActivityDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );

    const [activities, setActivities] = useState([]);
    const [message, setMessage] = useState("");
    const [stravaMessage, setStravaMessage] = useState("");

    const [stravaLoading, setStravaLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [stravaConnected, setStravaConnected] = useState(false);
    const [stravaStatusLoading, setStravaStatusLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [historyLoading, setHistoryLoading] = useState(false);

    // ACWR workload data
    const [workload, setWorkload] = useState({
        acuteLoad: 0,
        chronicLoad: 0,
        acwr: null
    });

    // Handle Strava callback status
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const stravaStatus = params.get("strava");

        if (stravaStatus === "connected") {
            setStravaMessage("Strava connected successfully!");
        } else if (stravaStatus === "denied") {
            setStravaMessage("Strava connection was cancelled.");
        } else if (stravaStatus === "already-connected") {
            setStravaMessage(
                "This StrideForge account already has another Strava account connected."
            );
        }

        if (stravaStatus) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, []);

    // Fetch Strava connection status
    const fetchStravaStatus = async () => {
        try {
            const response = await api.get("/strava/status");
            setStravaConnected(response.data.connected);
        } catch (error) {
            console.error("Strava status error:", error);
            setStravaConnected(false);
        } finally {
            setStravaStatusLoading(false);
        }
    };

    // Format activity date
    const getDateString = (date) => {
        if (typeof date === "string") {
            return date.slice(0, 10);
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    };

    // Fetch paginated running activities
    const fetchActivities = async (page = currentPage) => {
        setHistoryLoading(true);

        try {
            const response = await api.get(
                `/activities?page=${page}`
            );

            setActivities(response.data.activities);
            setPagination(response.data.pagination);
            setCurrentPage(response.data.pagination.page);

        } catch (error) {
            console.error("Activity fetch error:", error);
            setMessage("Unable to load running activities.");
        } finally {
            setHistoryLoading(false);
        }
    };

    // Fetch ACWR independently of pagination
    const fetchWorkload = async () => {
        try {
            const response = await api.get("/activities/workload");

            setWorkload({
                acuteLoad: response.data.acuteLoad,
                chronicLoad: response.data.chronicLoad,
                acwr: response.data.acwr
            });
        } catch (error) {
            console.error("Workload fetch error:", error);
        }
    };

    // Load dashboard data
    useEffect(() => {
        fetchActivities(1);
        fetchWorkload();
        fetchStravaStatus();
    }, []);

    // Add manual running activity
    const handleAddActivity = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            await api.post("/activities", {
                distance: Number(distance),
                duration: Number(duration),
                activity_date: activityDate
            });

            setMessage("Activity saved successfully!");

            setDistance("");
            setDuration("");

            await Promise.all([
                fetchActivities(1),
                fetchWorkload()
            ]);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to save activity."
            );
        }
    };

    // Connect Strava
    const handleConnectStrava = async () => {
        setStravaMessage("");
        setStravaLoading(true);

        try {
            const response = await api.get("/strava/connect");

            if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                setStravaMessage(
                    "Unable to generate Strava authorization URL."
                );
                setStravaLoading(false);
            }
        } catch (error) {
            setStravaMessage(
                error.response?.data?.message ||
                "Unable to connect to Strava."
            );
            setStravaLoading(false);
        }
    };

    // Synchronize Strava activities
    const handleSyncStrava = async () => {
        setSyncLoading(true);
        setStravaMessage("");

        try {
            const response = await api.post("/strava/sync");

            setStravaMessage(
                `${response.data.message}. ` +
                `Imported: ${response.data.imported}, ` +
                `Updated: ${response.data.updated}.`
            );

            await Promise.all([
                fetchActivities(1),
                fetchWorkload()
            ]);

        } catch (error) {
            setStravaMessage(
                error.response?.data?.message ||
                "Strava synchronization failed."
            );
        } finally {
            setSyncLoading(false);
        }
    };

    // Pagination controls
    const handlePreviousPage = () => {
        if (pagination.hasPreviousPage) {
            fetchActivities(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) {
            fetchActivities(currentPage + 1);
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // ACWR values
    const acuteLoad = workload.acuteLoad;
    const chronicLoad = workload.chronicLoad;
    const acwr = workload.acwr;

    // Workload status
    const getACWRStatus = () => {
        if (chronicLoad === 0) {
            return {
                status: "Insufficient Data",
                description:
                    "Previous four weeks of running data are required.",
                className: "neutral"
            };
        }

        if (acwr < 0.8) {
            return {
                status: "Low Workload",
                description:
                    "Your current workload is below your recent baseline.",
                className: "low"
            };
        }

        if (acwr <= 1.3) {
            return {
                status: "Balanced Workload",
                description:
                    "Your workload is within the selected monitoring range.",
                className: "balanced"
            };
        }

        if (acwr <= 1.5) {
            return {
                status: "Elevated Workload",
                description:
                    "Your workload has increased. Monitor recovery and fatigue.",
                className: "elevated"
            };
        }

        return {
            status: "High Workload",
            description:
                "Your workload is substantially above your recent baseline.",
            className: "high"
        };
    };

    const acwrStatus = getACWRStatus();

    return (
        <div className="dashboard">

            <header className="topbar">
                <h1>StrideForge<span>.</span></h1>

                <div className="user-section">
                    <span>Welcome, {user.name}</span>
                    <button onClick={logout}>Logout</button>
                </div>
            </header>

            <main className="dashboard-content">

                {/* Strava Integration */}
                <section className="panel">
                    <h2>Strava Integration</h2>

                    <p>
                        Connect your Strava account and synchronize
                        your running activities with StrideForge.
                    </p>

                    {stravaStatusLoading ? (
                        <p>Checking Strava connection...</p>
                    ) : stravaConnected ? (
                        <>
                            <p>
                                <strong>● Connected</strong>
                            </p>

                            <button
                                type="button"
                                onClick={handleSyncStrava}
                                disabled={syncLoading}
                            >
                                {syncLoading
                                    ? "Synchronizing..."
                                    : "Sync Strava Activities"}
                            </button>
                        </>
                    ) : (
                        <>
                            <p>
                                <strong>● Disconnected</strong>
                            </p>

                            <button
                                type="button"
                                onClick={handleConnectStrava}
                                disabled={stravaLoading}
                            >
                                {stravaLoading
                                    ? "Connecting..."
                                    : "Connect with Strava"}
                            </button>
                        </>
                    )}

                    {stravaMessage && (
                        <p className="message">{stravaMessage}</p>
                    )}
                </section>

                {/* Add Activity */}
                <section className="panel">
                    <h2>Add Running Activity</h2>
                    <p>Record your running session.</p>

                    <form
                        onSubmit={handleAddActivity}
                        className="activity-form"
                    >
                        <div>
                            <label>Distance (km)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Example: 5"
                                value={distance}
                                onChange={e =>
                                    setDistance(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <label>Duration (minutes)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Example: 30"
                                value={duration}
                                onChange={e =>
                                    setDuration(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div>
                            <label>Activity Date</label>
                            <input
                                type="date"
                                value={activityDate}
                                onChange={e =>
                                    setActivityDate(e.target.value)
                                }
                                required
                            />
                        </div>

                        <button type="submit">
                            Save Activity
                        </button>
                    </form>

                    {message && (
                        <p className="message">{message}</p>
                    )}
                </section>

                {/* ACWR */}
                <section className="panel">
                    <h2>ACWR Monitoring</h2>
                    <p>Acute-to-Chronic Workload Ratio</p>

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
                                    ? acwr.toFixed(2)
                                    : "--"}
                            </h3>
                            <small>Acute / Chronic</small>
                        </div>

                    </div>

                    <div className={`acwr-status ${acwrStatus.className}`}>
                        <h3>{acwrStatus.status}</h3>
                        <p>{acwrStatus.description}</p>
                    </div>

                    <p className="acwr-note">
                        ACWR is a training-load monitoring indicator.
                        It cannot independently predict or diagnose injuries.
                    </p>
                </section>

                {/* Running History */}
                <section className="panel">
                    <h2>Running History</h2>

                    <p>
                        Your recorded running activities.
                        {" "}
                        Total activities: {pagination.total}
                    </p>

                    {historyLoading ? (
                        <p>Loading running history...</p>
                    ) : activities.length === 0 ? (
                        <p>No running activities recorded yet.</p>
                    ) : (
                        <>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Distance</th>
                                            <th>Duration</th>
                                            <th>Pace</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {activities.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    {getDateString(
                                                        item.activity_date
                                                    )}
                                                </td>

                                                <td>
                                                    {Number(item.distance).toFixed(2)} km
                                                </td>

                                                <td>
                                                    {Number(item.duration).toFixed(2)} min
                                                </td>

                                                <td>
                                                    {(
                                                        Number(item.duration) /
                                                        Number(item.distance)
                                                    ).toFixed(2)} min/km
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="pagination-controls">
                                <button
                                    type="button"
                                    onClick={handlePreviousPage}
                                    disabled={
                                        !pagination.hasPreviousPage ||
                                        historyLoading
                                    }
                                >
                                    Previous
                                </button>

                                <span>
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={handleNextPage}
                                    disabled={
                                        !pagination.hasNextPage ||
                                        historyLoading
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </section>

            </main>
        </div>
    );
}

export default Dashboard;
