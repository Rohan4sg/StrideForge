
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./DashboardLayout.css";

function DashboardLayout() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const navigation = [
        { name: "Overview", path: "/dashboard", icon: "⌂" },
        { name: "Strava", path: "/dashboard/strava", icon: "↗" },
        { name: "Add Activity", path: "/dashboard/add-activity", icon: "+" },
        { name: "ACWR Monitoring", path: "/dashboard/acwr", icon: "◈" },
        { name: "Running History", path: "/dashboard/history", icon: "▤" }
    ];

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <h1 className="sidebar-logo">
                    StrideForge<span>.</span>
                </h1>

                <p className="sidebar-label">WORKSPACE</p>

                <nav className="sidebar-nav">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/dashboard"}
                            className={({ isActive }) =>
                                isActive ? "nav-link active" : "nav-link"
                            }
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <p>{user.name || "Runner"}</p>
                    <button onClick={logout}>Logout</button>
                </div>
            </aside>

            <div className="main-area">
                <header className="app-topbar">
                    <span>StrideForge / Performance</span>
                    <span className="topbar-user">
                        Welcome, {user.name || "Runner"}
                    </span>
                </header>

                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
