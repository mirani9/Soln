/**
 * SENTINEL — App Root
 * Routing + layout for all pages.
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StaffDashboard from './pages/StaffDashboard';
import GuestPortal from './pages/GuestPortal';
import Login from './pages/Login';
import CameraPage from './pages/CameraPage';
import IncidentsPage from './pages/IncidentsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/guest" element={<GuestPortal />} />
        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
      </Routes>
    </Router>
  );
}
