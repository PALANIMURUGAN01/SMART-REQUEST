import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiCpu } from "react-icons/fi";

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
            const res = await fetch("http://localhost:5000/forgot-password", {
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
            const res = await fetch("http://localhost:5000/reset-password", {
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
            <div className="card shadow-lg border-0 overflow-hidden" style={{ width: "100%", maxWidth: "900px", minHeight: "560px" }}>
                <div className="row g-0 h-100">
                    {/* Left Side - Hero */}
                    <div
                        className="col-md-5 d-none d-md-flex flex-column justify-content-center align-items-center text-white p-5"
                        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                    >
                        <div className="mb-4 bg-white bg-opacity-25 rounded-circle p-4">
                            <FiCpu size={64} color="white" />
                        </div>
                        <h2 className="fw-bold mb-3">Reset Password</h2>
                        <p className="text-center opacity-75 fs-5">
                            Recover access to your SRLM account securely.
                        </p>
                        <div className="mt-4 w-100">
                            <div className={`d-flex align-items-center gap-3 mb-3 p-3 rounded-3 ${step >= 1 ? "bg-white bg-opacity-25" : "bg-white bg-opacity-10"}`}>
                                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                                    style={{ width: 32, height: 32, background: step > 1 ? "#4ade80" : "rgba(255,255,255,0.5)", fontSize: 14 }}>
                                    {step > 1 ? <FiCheckCircle size={18} /> : "1"}
                                </div>
                                <span className={step >= 1 ? "fw-bold" : "opacity-50"}>Verify Email</span>
                            </div>
                            <div className={`d-flex align-items-center gap-3 p-3 rounded-3 ${step >= 2 ? "bg-white bg-opacity-25" : "bg-white bg-opacity-10"}`}>
                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                    style={{ width: 32, height: 32, background: step > 2 ? "#4ade80" : "rgba(255,255,255,0.5)", fontSize: 14 }}>
                                    {step > 2 ? <FiCheckCircle size={18} /> : "2"}
                                </div>
                                <span className={step >= 2 ? "fw-bold" : "opacity-50"}>Set New Password</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="col-md-7 bg-white p-5 d-flex flex-column justify-content-center">

                        {/* Step 1 - Verify Email */}
                        {step === 1 && (
                            <>
                                <div className="mb-4">
                                    <Link to="/" className="text-muted text-decoration-none d-flex align-items-center gap-2 small mb-4">
                                        <FiArrowLeft /> Back to Login
                                    </Link>
                                    <h3 className="fw-bold text-dark mb-1">Forgot Password?</h3>
                                    <p className="text-muted small">Enter your registered email address to continue.</p>
                                </div>

                                {errors.general && (
                                    <div className="alert alert-danger alert-dismissible py-2 small" role="alert">
                                        {errors.general}
                                        <button type="button" className="btn-close btn-sm" onClick={() => setErrors({})} />
                                    </div>
                                )}

                                <form onSubmit={handleVerifyEmail} noValidate>
                                    <div className="mb-4">
                                        <label className="form-label text-secondary small fw-bold">EMAIL ADDRESS</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted"><FiMail /></span>
                                            <input
                                                type="email"
                                                className={`form-control bg-light border-start-0 ps-0 ${errors.email ? "is-invalid" : ""}`}
                                                placeholder="name@company.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={loading}
                                                style={{ height: "45px" }}
                                            />
                                        </div>
                                        {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                                    </div>

                                    <div className="d-grid">
                                        <button
                                            type="submit"
                                            className="btn fw-bold text-uppercase py-3 shadow-sm text-white"
                                            disabled={loading}
                                            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
                                        >
                                            {loading ? "Verifying..." : "Verify Email"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* Step 2 - Set New Password */}
                        {step === 2 && (
                            <>
                                <div className="mb-4">
                                    <button className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-2 small mb-3 p-0"
                                        onClick={() => { setStep(1); setErrors({}); }}>
                                        <FiArrowLeft /> Back
                                    </button>
                                    <h3 className="fw-bold text-dark mb-1">Set New Password</h3>
                                    {verifiedName && (
                                        <p className="text-muted small">
                                            Hello <strong>{verifiedName}</strong>, create a new password for your account.
                                        </p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="alert alert-danger alert-dismissible py-2 small" role="alert">
                                        {errors.general}
                                        <button type="button" className="btn-close btn-sm" onClick={() => setErrors({})} />
                                    </div>
                                )}

                                <form onSubmit={handleResetPassword} noValidate>
                                    <div className="mb-3">
                                        <label className="form-label text-secondary small fw-bold">NEW PASSWORD</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted"><FiLock /></span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className={`form-control bg-light border-start-0 ps-0 ${errors.newPassword ? "is-invalid" : ""}`}
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={loading}
                                                style={{ height: "45px" }}
                                            />
                                            <button type="button" className="input-group-text bg-light border-start-0 text-muted"
                                                onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                                                {showPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {errors.newPassword && <div className="text-danger small mt-1">{errors.newPassword}</div>}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-secondary small fw-bold">CONFIRM PASSWORD</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 text-muted"><FiLock /></span>
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                className={`form-control bg-light border-start-0 ps-0 ${errors.confirmPassword ? "is-invalid" : ""}`}
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={loading}
                                                style={{ height: "45px" }}
                                            />
                                            <button type="button" className="input-group-text bg-light border-start-0 text-muted"
                                                onClick={() => setShowConfirm(!showConfirm)} style={{ cursor: "pointer" }}>
                                                {showConfirm ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                                    </div>

                                    <div className="d-grid">
                                        <button
                                            type="submit"
                                            className="btn fw-bold text-uppercase py-3 shadow-sm text-white"
                                            disabled={loading}
                                            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
                                        >
                                            {loading ? "Resetting..." : "Reset Password"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* Step 3 - Success */}
                        {step === 3 && (
                            <div className="text-center py-4">
                                <div className="mb-4 d-flex justify-content-center">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: 80, height: 80, background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
                                        <FiCheckCircle size={40} color="white" />
                                    </div>
                                </div>
                                <h3 className="fw-bold text-dark mb-2">Password Reset!</h3>
                                <p className="text-muted mb-4">{successMsg || "Your password has been reset successfully."}</p>
                                <button
                                    className="btn fw-bold text-uppercase py-3 px-5 shadow-sm text-white"
                                    onClick={() => navigate("/")}
                                    style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
                                >
                                    Back to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
