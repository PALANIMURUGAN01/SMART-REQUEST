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
      <div className="card shadow-lg border-0 overflow-hidden" style={{ width: "100%", maxWidth: "900px", minHeight: "600px" }}>
        <div className="row g-0 h-100">
          {/* Left Side - Hero Section */}
          <div className="col-md-5 d-none d-md-flex flex-column justify-content-center align-items-center text-white p-5 grad-indigo">
            <div className="mb-4 bg-white bg-opacity-25 rounded-circle p-4">
              <FiCpu size={64} color="white" />
            </div>
            <h2 className="fw-bold mb-3 outfit-font">Join Us!</h2>
            <p className="text-center opacity-75 fs-5">
              Create an account and start managing your requests efficiently.
            </p>
            <div className="mt-5 d-flex gap-3 text-white-50">
              <FiCheckCircle size={24} />
              <small>Easy Setup</small>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="col-md-7 bg-white p-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 className="fw-bold text-dark mb-0 outfit-font">Create Account</h3>
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
            <form onSubmit={handleSignup} noValidate>
              {/* Full Name */}
              <div className="mb-3">
                <label className="form-label text-secondary small fw-bold">FULL NAME</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted"><FiUser /></span>
                  <input
                    type="text"
                    className={`form-control bg-light border-0 shadow-sm ${errors.fullName ? "is-invalid" : ""}`}
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    style={{ height: "48px", paddingLeft: "15px" }}
                  />
                </div>
                {errors.fullName && <div className="text-danger small mt-1">{errors.fullName}</div>}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label text-secondary small fw-bold">EMAIL ADDRESS</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted"><FiMail /></span>
                  <input
                    type="email"
                    className={`form-control bg-light border-0 shadow-sm ${errors.email ? "is-invalid" : ""}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    style={{ height: "48px", paddingLeft: "15px" }}
                  />
                </div>
                {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
              </div>

              {/* Password */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-secondary small fw-bold">PASSWORD</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted"><FiLock /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control bg-light border-start-0 ps-0 ${errors.password ? "is-invalid" : ""}`}
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      style={{ height: "45px" }}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-secondary small fw-bold">CONFIRM</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted"><FiLock /></span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-control bg-light border-start-0 ps-0 ${errors.confirmPassword ? "is-invalid" : ""}`}
                      placeholder="Confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      style={{ height: "45px" }}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light border-start-0 text-muted"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                </div>
              </div>

              {/* Terms & Conditions */}
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
                    I agree to the <a href="#terms" className="text-decoration-none" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms & Conditions</a>
                  </label>
                </div>
                {errors.terms && <div className="text-danger small">{errors.terms}</div>}
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                className="btn grad-indigo w-100 py-3 fw-bold text-uppercase shadow-md mb-3 border-0 rounded-3"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>

              <div className="position-relative text-center mb-3">
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
                  text="signup_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>

            </form>

            {/* Footer - Login Link */}
            <div className="text-center mt-4">
              <p className="text-muted small">
                Already have an account? <Link to="/" className="text-primary text-decoration-none fw-bold">Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
