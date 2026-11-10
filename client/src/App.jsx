
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ACWR from "./pages/ACWR";
import AddActivity from "./pages/AddActivity";
import RunningHistory from "./pages/RunningHistory";
import Strava from "./pages/Strava";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="strava" element={<Strava />} />
                    <Route path="add-activity" element={<AddActivity />} />
                    <Route path="acwr" element={<ACWR />} />
                    <Route path="history" element={<RunningHistory />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
