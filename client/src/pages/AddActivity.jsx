
import { useState } from "react";
import api from "../services/api";
import "./Dashboard.css";

function AddActivity() {
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [activityDate, setActivityDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            await api.post("/activities", {
                distance: Number(distance),
                duration: Number(duration),
                activity_date: activityDate
            });

            setMessage("Activity saved successfully!");
            setDistance("");
            setDuration("");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to save activity."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <section className="panel">
                <h2>Add Running Activity</h2>
                <p>Record your running session.</p>

                <form onSubmit={handleSubmit} className="activity-form">
                    <div>
                        <label>Distance (km)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Example: 5"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
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
                            onChange={(e) => setDuration(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>Activity Date</label>
                        <input
                            type="date"
                            value={activityDate}
                            onChange={(e) => setActivityDate(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Activity"}
                    </button>
                </form>

                {message && <p className="message">{message}</p>}
            </section>
        </div>
    );
}

export default AddActivity;
