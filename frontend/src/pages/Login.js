import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiCpu } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import TermsModal from "../components/TermsModal";

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
      const res = await fetch("http://localhost:5000/login", {
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
      const res = await fetch("http://localhost:5000/auth/google", {
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
      <div className="card shadow-lg border-0 overflow-hidden" style={{ width: "100%", maxWidth: "900px", minHeight: "600px" }}>
        <div className="row g-0 h-100">
          {/* Left Side - Hero Section */}
          <div className="col-md-5 d-none d-md-flex flex-column justify-content-center align-items-center text-white p-5 grad-indigo">
            <div className="mb-4 bg-white bg-opacity-25 rounded-circle p-4">
              <FiCpu size={64} color="white" />
            </div>
            <h2 className="fw-bold mb-3 outfit-font">Welcome Back!</h2>
            <p className="text-center opacity-75 fs-5">
              Securely manage your requests with SRLM Modern Dashboard.
            </p>
            <div className="mt-5 d-flex gap-3 text-white-50">
              <div className="d-flex align-items-center gap-2">
                <FiCheckCircle size={20} />
                <span>Secure</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <FiCheckCircle size={20} />
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="col-md-7 bg-white p-5">
            <div className="d-flex align-items-center justify-content-between mb-5">
              <h3 className="fw-bold text-dark mb-0 outfit-font">Login</h3>
              <span className="badge bg-light text-primary border rounded-pill px-3 py-2 fw-semibold">SRLM v2.1</span>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {errors.general}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setErrors({ ...errors, general: "" })}
                />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} noValidate>
              <div className="mb-4">
                <label className="form-label text-secondary small fw-bold">EMAIL ADDRESS</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted"><FiMail /></span>
                  <input
                    type="email"
                    className={`form-control bg-light border-0 shadow-sm ${errors.email ? "is-invalid" : ""}`}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    style={{ height: "48px", paddingLeft: "15px" }}
                  />
                </div>
                {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label text-secondary small fw-bold">PASSWORD</label>
                  <Link to="/forgot-password" className="text-primary text-decoration-none small fw-bold">Forgot?</Link>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted"><FiLock /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`form-control bg-light border-0 shadow-sm ${errors.password ? "is-invalid" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    style={{ height: "48px", paddingLeft: "15px" }}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: "pointer" }}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
              </div>

              <div className="d-grid gap-2 mb-4">
                <button
                  type="submit"
                  className="btn grad-indigo fw-bold text-uppercase py-3 shadow-md rounded-3 border-0"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Log In"}
                </button>
              </div>
            </form>

            <div className="position-relative text-center mb-4">
              <hr className="text-muted opacity-25" />
              <span className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted small">OR</span>
            </div>

            <div className="d-flex justify-content-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="text-center mt-4">
              <p className="text-muted small mb-2">
                Don't have an account? <Link to="/signup" className="text-primary text-decoration-none fw-bold">Sign up</Link>
              </p>
              <div className="small text-muted">
                <a href="#terms" className="text-decoration-none text-muted" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms & Conditions</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
