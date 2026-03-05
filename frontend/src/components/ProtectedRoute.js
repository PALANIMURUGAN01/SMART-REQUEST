import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    user = null;
  }

  const role = (user && user.role) ? (user.role || "").toLowerCase() : null;

  if (!role) {
    // not logged in
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length && !allowedRoles.map(r => r.toLowerCase()).includes(role)) {
    // unauthorized for this role
    // redirect: staff -> staff dashboard, admin -> admin, users -> dashboard
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "staff") return <Navigate to="/staff-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
