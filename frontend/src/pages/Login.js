import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiCpu } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";
import TermsModal from "../components/TermsModal";
import { API_URL } from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  function validate() {
    const e = {};
    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      e.email = "Enter a valid email address.";
    }
    if (!password) {
      e.password = "Password is required.";
    }
    return e;
  }

  async function handleLogin(e) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userEmail", data.user.email); // For legacy compatibility if needed

      const userRole = (data.user?.role || "user").toLowerCase();
      if (userRole === "admin") navigate("/admin");
      else if (userRole === "staff") navigate("/staff-dashboard");
      else navigate("/dashboard");

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google login failed");

      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setErrors({ general: "Google login was unsuccessful. Try again later." });
  }

  return (
    <div className="auth-bg">
      <TermsModal show={showTerms} onClose={() => setShowTerms(false)} />
      <div className="auth-card animate-up">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: "64px", height: "64px" }}>
            <FiCpu size={30} />
          </div>
          <h3 className="fw-bold text-dark mb-1 outfit-font">Welcome Back</h3>
          <p className="text-muted small">Log in to continue to SRLM Dashboard</p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="alert alert-danger alert-dismissible fade show small py-2 d-flex align-items-center" role="alert">
            <div className="flex-grow-1">{errors.general}</div>
            <button
              type="button"
              className="btn-close btn-close-sm position-relative"
              style={{ padding: "0" }}
              onClick={() => setErrors({ ...errors, general: "" })}
            ></button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-bold">Email Address</label>
            <div className={`input-group rounded-3 overflow-hidden ${errors.email ? 'border border-danger' : 'border'}`} style={{ borderColor: "var(--border-color)" }}>
              <span className="input-group-text bg-white border-0 text-muted ps-3 pe-2"><FiMail size={18} /></span>
              <input
                type="email"
                className="form-control border-0 shadow-none ps-2"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={{ height: "48px", backgroundColor: "white" }}
              />
            </div>
            {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label text-secondary small fw-bold mb-0">Password</label>
              <Link to="/forgot-password" className="text-primary text-decoration-none small fw-medium">Forgot Password?</Link>
            </div>
            <div className={`input-group rounded-3 overflow-hidden ${errors.password ? 'border border-danger' : 'border'}`} style={{ borderColor: "var(--border-color)" }}>
              <span className="input-group-text bg-white border-0 text-muted ps-3 pe-2"><FiLock size={18} /></span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control border-0 shadow-none ps-2"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ height: "48px", backgroundColor: "white" }}
              />
              <button
                type="button"
                className="input-group-text bg-white border-0 text-muted pe-3 ps-2"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-medium mb-3 rounded-3"
            style={{ height: "48px", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <div className="position-relative text-center my-4">
          <hr className="text-muted opacity-25" />
          <span className="position-absolute top-50 start-50 translate-middle px-3 text-muted small fw-medium" style={{ fontSize: "0.75rem", backgroundColor: "var(--card-bg)" }}>OR CONTINUE WITH</span>
        </div>

        <div className="d-flex justify-content-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="320"
          />
        </div>

        <div className="text-center mt-3">
          <p className="text-muted small mb-1">
            Don't have an account? <Link to="/signup" className="text-primary text-decoration-none fw-medium">Sign up</Link>
          </p>
          <a href="#terms" className="text-decoration-none text-muted small" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms & Conditions</a>
        </div>
      </div>
    </div>
  );
}
