import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FiHome,
  FiPlusSquare,
  FiList,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiGrid,
  FiClipboard
} from "react-icons/fi";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userObj] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const role = (userObj.role || "user").toLowerCase();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 992;

  const allMenuItems = [
    { label: "Admin Dashboard",  path: "/admin",           icon: <FiGrid size={18} />,      roles: ["admin"] },
    { label: "Staff Dashboard",  path: "/staff-dashboard", icon: <FiClipboard size={18} />, roles: ["staff"] },
    { label: "All Requests",     path: "/requests",        icon: <FiList size={18} />,      roles: ["admin", "staff"] },
    { label: "Dashboard",        path: "/dashboard",       icon: <FiHome size={18} />,      roles: ["user"] },
    { label: "Create Request",   path: "/create",          icon: <FiPlusSquare size={18} />,roles: ["user"] },
    { label: "My Requests",      path: "/my-requests",     icon: <FiList size={18} />,      roles: ["user"] },
    { label: "Reports",          path: "/reports",         icon: <FiBarChart2 size={18} />, roles: ["user", "staff", "admin"] },
    { label: "Profile",          path: "/profile",         icon: <FiUser size={18} />,      roles: ["user", "staff", "admin"] },
    { label: "Settings",         path: "/settings",        icon: <FiSettings size={18} />,  roles: ["user", "staff", "admin"] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  function closeMobile() {
    if (!isDesktop) setIsOpen(false);
  }

  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {}
    closeMobile();
    navigate("/");
  }

  const visible = isDesktop || isOpen;

  return (
    <>
      {/* Mobile dim overlay */}
      {isOpen && !isDesktop && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className="sidebar-container"
        style={{
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          visibility: visible ? "visible" : "hidden",
        }}
      >
        {/* Section label */}
        <div className="px-2 mb-2 mt-1">
          <div className="sidebar-section-label">Navigation</div>
        </div>

        {/* Main menu */}
        <div className="d-flex flex-column gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
              onClick={closeMobile}
            >
              <span className="sidebar-icon me-3">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-color)", margin: "1rem 0.5rem" }} />

        {/* Quick links */}
        <div className="px-2 mb-2">
          <div className="sidebar-section-label">Account</div>
        </div>
        <div className="d-flex flex-column gap-1">
          <Link
            to="/help"
            className={`sidebar-link ${location.pathname === "/help" ? "active" : ""}`}
            onClick={closeMobile}
          >
            <span className="sidebar-icon me-3"><FiHelpCircle size={18} /></span>
            <span>Help & Support</span>
          </Link>

          <button
            onClick={handleLogout}
            className="sidebar-link border-0 bg-transparent text-start w-100"
            style={{ color: "#ef4444" }}
          >
            <span className="sidebar-icon me-3"><FiLogOut size={18} /></span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
