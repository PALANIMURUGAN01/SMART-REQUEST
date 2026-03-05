import { Link, useLocation, useNavigate } from "react-router-dom";
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

  function goHelp() {
    if (window.innerWidth < 992) setIsOpen(false);
    navigate("/help");
  }

  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {
      // ignore
    }
    if (window.innerWidth < 992) setIsOpen(false);
    navigate("/");
  }

  const userObj = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  })();
  const role = (userObj.role || "User").toLowerCase();

  const allPossibleItems = [
    { label: "Admin Dashboard", path: "/admin", icon: <FiGrid size={20} />, roles: ["admin"] },
    { label: "Staff Dashboard", path: "/staff-dashboard", icon: <FiClipboard size={20} />, roles: ["staff"] },
    { label: "All Requests", path: "/requests", icon: <FiList size={20} />, roles: ["admin", "staff"] },
    { label: "Dashboard", path: "/dashboard", icon: <FiHome size={20} />, roles: ["user"] },
    { label: "Create Request", path: "/create", icon: <FiPlusSquare size={20} />, roles: ["user"] },
    { label: "My Requests", path: "/my-requests", icon: <FiList size={20} />, roles: ["user"] },
    { label: "Reports", path: "/reports", icon: <FiBarChart2 size={20} />, roles: ["user", "staff", "admin"] },
    { label: "Profile", path: "/profile", icon: <FiUser size={20} />, roles: ["user", "staff", "admin"] },
    { label: "Settings", path: "/settings", icon: <FiSettings size={20} />, roles: ["user", "staff", "admin"] },
  ];

  const menuItems = allPossibleItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Overlay for mobile only */}
      {isOpen && window.innerWidth < 992 && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-25 sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className="position-fixed start-0 sidebar-container"
        style={{ width: (window.innerWidth >= 992 || isOpen) ? 280 : 0 }}
      >
        <div className="p-3" style={{ paddingBottom: '80px' }}>

          <div className="px-1 mb-1">
            <div className="sidebar-section-label">Menu</div>
          </div>

          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => {
                if (window.innerWidth < 992) setIsOpen(false);
              }}
            >
              <span className="me-3 sidebar-icon">
                {item.icon}
              </span>
              <span className="fw-medium">{item.label}</span>
            </Link>
          ))}

          <div className="px-1 mb-1 mt-2">
            <div className="sidebar-section-label">Quick Links</div>
          </div>

          <button onClick={goHelp} className="sidebar-link w-100 border-0 bg-transparent text-start">
            <span className="me-3 sidebar-icon d-flex">
              <FiHelpCircle size={20} />
            </span>
            <span>Help & Support</span>
          </button>

          <button onClick={handleLogout} className="sidebar-link w-100 border-0 bg-transparent text-start text-danger mt-2">
            <span className="me-3 sidebar-icon d-flex">
              <FiLogOut size={20} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
