import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiCpu } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import TermsModal from "../components/TermsModal";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  function validate() {
    const e = {};

    if (!fullName.trim()) {
      e.fullName = "Full name is required.";
    } else if (fullName.trim().length < 3) {
      e.fullName = "Full name must be at least 3 characters.";
    }

    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      e.email = "Enter a valid email address.";
    }

    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 4) {
      e.password = "Password must be at least 4 characters.";
    }

    if (!confirmPassword) {
      e.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }

    if (!agreeTerms) {
      e.terms = "You must agree to the terms and conditions.";
    }

    return e;
  }

  async function handleSignup(e) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Auto login or redirect to login
      navigate("/"); // Redirect to login
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
      if (!res.ok) throw new Error(data.error || "Google signup failed");

      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setErrors({ general: "Google signup was unsuccessful. Try again later." });
  }

  return (
    <div className="auth-bg">
      <TermsModal show={showTerms} onClose={() => setShowTerms(false)} />
      <div className="auth-card animate-up">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: "64px", height: "64px" }}>
            <FiCpu size={30} />
          </div>
          <h3 className="fw-bold text-dark mb-1 outfit-font">Create an Account</h3>
          <p className="text-muted small">Join us and start managing your requests</p>
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
        <form onSubmit={handleSignup} noValidate>
          {/* Full Name */}
          <div className="mb-3">
            <label className="form-label text-secondary small fw-bold">Full Name</label>
            <div className={`input-group rounded-3 overflow-hidden ${errors.fullName ? 'border border-danger' : 'border'}`} style={{ borderColor: "var(--border-color)" }}>
              <span className="input-group-text bg-white border-0 text-muted ps-3 pe-2"><FiUser size={18} /></span>
              <input
                type="text"
                className="form-control border-0 shadow-none ps-2"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                style={{ height: "48px", backgroundColor: "white" }}
              />
            </div>
            {errors.fullName && <div className="text-danger small mt-1">{errors.fullName}</div>}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label text-secondary small fw-bold">Password</label>
              <div className={`input-group rounded-3 overflow-hidden ${errors.password ? 'border border-danger' : 'border'}`} style={{ borderColor: "var(--border-color)" }}>
                <span className="input-group-text bg-white border-0 text-muted ps-3 pe-1"><FiLock size={18} /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control border-0 shadow-none ps-2"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ height: "48px", backgroundColor: "white", paddingRight: 0 }}
                />
                <button
                  type="button"
                  className="input-group-text bg-white border-0 text-muted pe-3 ps-1"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label text-secondary small fw-bold">Confirm</label>
              <div className={`input-group rounded-3 overflow-hidden ${errors.confirmPassword ? 'border border-danger' : 'border'}`} style={{ borderColor: "var(--border-color)" }}>
                <span className="input-group-text bg-white border-0 text-muted ps-3 pe-1"><FiLock size={18} /></span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control border-0 shadow-none ps-2"
                  placeholder="Confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  style={{ height: "48px", backgroundColor: "white", paddingRight: 0 }}
                />
                <button
                  type="button"
                  className="input-group-text bg-white border-0 text-muted pe-3 ps-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ cursor: "pointer" }}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
            </div>
          </div>

          {/* Terms */}
          <div className="mb-4">
            <div className="form-check">
              <input
                type="checkbox"
                className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
              />
              <label className="form-check-label small text-muted" htmlFor="agreeTerms">
                I agree to the <a href="#terms" className="text-decoration-none fw-medium text-primary" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms & Conditions</a>
              </label>
            </div>
            {errors.terms && <div className="text-danger small mt-1">{errors.terms}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-medium mb-3 rounded-3"
            style={{ height: "48px", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)" }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="position-relative text-center my-4">
          <hr className="text-muted opacity-25" />
          <span className="position-absolute top-50 start-50 translate-middle px-3 text-muted small fw-medium" style={{ fontSize: "0.75rem", backgroundColor: "var(--card-bg)" }}>OR SIGN UP WITH</span>
        </div>

        <div className="d-flex justify-content-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            text="signup_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="text-center mt-3">
          <p className="text-muted small mb-1">
            Already have an account? <Link to="/" className="text-primary text-decoration-none fw-medium">Log in instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
