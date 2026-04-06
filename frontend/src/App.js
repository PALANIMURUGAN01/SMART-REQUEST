import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import CreateRequest from "./pages/CreateRequest";
import Requests from "./pages/Requests";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import GuideDetails from "./pages/GuideDetails";
import MyRequests from "./pages/MyRequests";
import AdminPanel from "./pages/AdminPanel";
import StaffDashboard from "./pages/StaffDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingChat from "./components/FloatingChat";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 992);
  const location = useLocation();
  const isAuthPage = location.pathname === "/" || location.pathname === "/signup" || location.pathname === "/forgot-password";

  useEffect(() => {
    // Force Light Mode
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ height: "100vh", overflow: isAuthPage ? "auto" : "hidden" }}>
      {/* Full-width Navbar at the very top */}
      {!isAuthPage && <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />}

      {/* Sidebar (position:fixed — does not affect document flow) */}
      {!isAuthPage && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}

      {/* Main content area — offset by sidebar width on desktop */}
      <div
        className="content-transition"
        style={{
          marginLeft: !isAuthPage && window.innerWidth >= 992 ? 280 : 0,
        }}
      >
        <div className={isAuthPage ? "auth-container" : "main-content"}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["user"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute allowedRoles={["user"]}><CreateRequest /></ProtectedRoute>} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/my-requests" element={<ProtectedRoute allowedRoles={["user", "staff", "admin"]}><MyRequests /></ProtectedRoute>} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/staff-dashboard" element={<ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/help/guide/:id" element={<GuideDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      {/* Global Floating Chat Widget */}
      {!isAuthPage && <FloatingChat />}
    </div>
  );
}

function App() {
  const clientId = "756289965570-8pu7rjkq252b1gns1na0ni9jrt0ucsc9.apps.googleusercontent.com"; // Updated with actual Client ID

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;

