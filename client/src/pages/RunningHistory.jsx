
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Dashboard.css";

function RunningHistory() {
    const [activities, setActivities] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [loading, setLoading] = useState(true);

    const fetchActivities = async (page) => {
        setLoading(true);

        try {
            const response = await api.get(`/activities?page=${page}`);

            setActivities(response.data.activities);
            setPagination(response.data.pagination);
            setCurrentPage(response.data.pagination.page);
        } catch (error) {
            console.error("Activity fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(1);
    }, []);

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

    return (
        <div className="dashboard">
            <section className="panel">
                <h2>Running History</h2>

                <p>
                    Your recorded running activities.
                    {" "}Total activities: {pagination.total}
                </p>

                {loading ? (
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
                                    {activities.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                {getDateString(item.activity_date)}
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

                        <div className="pagination-controls">
                            <button
                                type="button"
                                onClick={() => fetchActivities(currentPage - 1)}
                                disabled={!pagination.hasPreviousPage || loading}
                            >
                                Previous
                            </button>

                            <span>
                                Page {pagination.page} of {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => fetchActivities(currentPage + 1)}
                                disabled={!pagination.hasNextPage || loading}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

export default RunningHistory;
