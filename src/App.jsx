import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Layout from "./components/Layout";
import Arrivals from "./pages/Arrivals";
import Departures from "./pages/Departures";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFlights from "./pages/AdminFlights";
import AdminAirports from "./pages/AdminAirports";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/arrivals" replace />} />
        <Route path="/arrivals" element={<Arrivals />} />
        <Route path="/departures" element={<Departures />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/flights" element={<AdminFlights />} />
        <Route path="/admin/airports" element={<AdminAirports />} />
        <Route path="*" element={<p className="page">Not found.</p>} />
      </Route>
    </Routes>
  );
}
