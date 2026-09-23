import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import NewBooking from './pages/NewBooking';
import MyBookings from './pages/MyBookings';
import HallAvailability from './pages/HallAvailability';
import AccessDenied from './pages/AccessDenied';
import NotFound from './pages/NotFound';
import UserManagement from './pages/UserManagement';
import HallBookingApprovals from './pages/HallBookingApprovals';
import AuditLogs from './pages/AuditLogs';
import FacultyList from './pages/FacultyList';
import HallList from './pages/HallList';
import CoordinatorList from './pages/CoordinatorList';
import AdminManagement from './pages/AdminManagement';
import Reports from './pages/Reports';
import RoomManagement from './pages/RoomManagement';
import ReallocationRequests from './pages/ReallocationRequests';
import { Toaster } from 'sonner';


// Route-level fade/slide transition — Framer Motion was already a declared
// dependency and advertised in the README but wasn't actually used anywhere;
// wrapping the routed content here gives every page a consistent, low-effort
// entrance/exit animation without needing to touch each page individually.
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user-management"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hall-booking-approvals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HallBookingApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty-list"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <FacultyList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coordinator-list"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CoordinatorList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hall-list"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HallList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admin-management"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/room-management"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RoomManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator-dashboard"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-booking"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <NewBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hall-availability"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <HallAvailability />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reallocation-requests"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <ReallocationRequests />
              </ProtectedRoute>
            }
          />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="bottom-right" duration={2000} />
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;