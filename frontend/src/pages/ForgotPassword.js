import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // Step 1: enter email, Step 2: reset password
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const navigate = useNavigate();

  async function handleVerifyEmail(e) {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: "Email is required." });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setVerifiedName(data.name || "");
      setStep(2);
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setErrors({});

    if (!newPassword) {
      setErrors({ newPassword: "New password is required." });
      return;
    }
    if (newPassword.length < 4) {
      setErrors({ newPassword: "Password must be at least 4 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setSuccessMsg(data.message);
      setStep(3); // Success state
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card animate-up">
        {step === 1 && (
          <div>
            <div className="text-center bg-white p-0 mb-4">
              <Link to="/" className="text-muted text-decoration-none d-flex align-items-center gap-2 small mb-4">
                <FiArrowLeft /> Back to Login
              </Link>
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: "64px", height: "64px" }}>
                <FiMail size={30} />
              </div>
              <h3 className="fw-bold text-dark mb-1 outfit-font">Forgot Password?</h3>
              <p className="text-muted small">Enter your email to receive a reset link</p>
            </div>

            {errors.general && (
              <div className="alert alert-danger alert-dismissible fade show small py-2 d-flex align-items-center" role="alert">
                <div className="flex-grow-1">{errors.general}</div>
                <button type="button" className="btn-close btn-close-sm position-relative" style={{ padding: "0" }} onClick={() => setErrors({ ...errors, general: "" })}></button>
              </div>
            )}

            <form onSubmit={handleVerifyEmail} noValidate>
              <div className="mb-4">
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

              <button
                type="submit"
                className="btn btn-primary w-100 fw-medium rounded-3"
                style={{ height: "48px", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)" }}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4">
              <button className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-2 small mb-3 p-0" onClick={() => { setStep(1); setErrors({}); }}>
                <FiArrowLeft /> Back
              </button>
              <div className="text-center">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: "64px", height: "64px" }}>
                  <FiLock size={30} />
                </div>
                <h3 className="fw-bold text-dark mb-1 outfit-font">Set New Password</h3>
                {verifiedName ? (
                  <p className="text-muted small">Hello <strong>{verifiedName}</strong>, create a new password for your account.</p>
                ) : (
                  <p className="text-muted small">Create a new password for your account.</p>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="alert alert-danger alert-dismissible fade show small py-2 d-flex align-items-center" role="alert">
                <div className="flex-grow-1">{errors.general}</div>
                <button type="button" className="btn-close btn-close-sm position-relative" style={{ padding: "0" }} onClick={() => setErrors({})}></button>
              </div>
            )}

            <form onSubmit={handleResetPassword} noValidate>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-bold">New Password</label>
                <div className={`input-group rounded-3 overflow-hidden ${errors.newPassword ? 'border border-danger' : 'border'}`} style={{ borderColor: "var(--border-color)" }}>
                  <span className="input-group-text bg-white border-0 text-muted ps-3 pe-2"><FiLock size={18} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control border-0 shadow-none ps-2"
                    placeholder="Min 6 chars"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    style={{ height: "48px", backgroundColor: "white" }}
                  />
                  <button type="button" className="input-group-text bg-white border-0 text-muted pe-3 ps-1" onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <div className="text-danger small mt-1">{errors.newPassword}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-bold">Confirm Password</label>
                <div className={`input-group rounded-3 overflow-hidden ${errors.confirmPassword ? 'border border-danger' : 'border'}`} style={{ borderColor: "var(--border-color)" }}>
                  <span className="input-group-text bg-white border-0 text-muted ps-3 pe-2"><FiLock size={18} /></span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="form-control border-0 shadow-none ps-2"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    style={{ height: "48px", backgroundColor: "white" }}
                  />
                  <button type="button" className="input-group-text bg-white border-0 text-muted pe-3 ps-1" onClick={() => setShowConfirm(!showConfirm)} style={{ cursor: "pointer" }}>
                    {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-medium rounded-3"
                style={{ height: "48px", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)" }}
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="mb-4 d-flex justify-content-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-10"
                style={{ width: 80, height: 80 }}>
                <FiCheckCircle size={40} className="text-success" />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-2 outfit-font">Password Reset!</h3>
            <p className="text-muted mb-4">{successMsg || "Your password has been reset successfully."}</p>
            <button
              className="btn btn-primary w-100 fw-medium rounded-3"
              onClick={() => navigate("/")}
              style={{ height: "48px", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)" }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
