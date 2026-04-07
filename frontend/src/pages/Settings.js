import { useState } from "react";
import { FiSettings, FiLock, FiCheckCircle, FiMail, FiTarget, FiShield } from "react-icons/fi";
import { API_URL } from "../config";

export default function Settings() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handlePasswordSave = async () => {
    const newErrors = {};

    if (!passwordData.current) newErrors.current = "Current password is required";
    if (!passwordData.new) {
      newErrors.new = "New password is required";
    } else if (passwordData.new.length < 4) {
      newErrors.new = "Password must be at least 4 characters";
    }
    if (!passwordData.confirm) {
      newErrors.confirm = "Please confirm your password";
    } else if (passwordData.new !== passwordData.confirm) {
      newErrors.confirm = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }

      const updatedUser = await res.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setErrors({});
      setSuccessMessage("✅ Password updated successfully!");
      setPasswordData({ current: "", new: "", confirm: "" });
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5 animate-fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h2 className="mb-1 fw-bold text-primary outfit-font">Settings & Security</h2>
          <p className="text-muted small mb-0">Manage your profile information and account protection</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary border border-primary-subtle">
            <FiSettings size={20} />
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center rounded-3">
          <FiCheckCircle className="me-2 text-success" /> {successMessage}
        </div>
      )}

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-5 col-xl-4">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
            <div className="card-header bg-primary py-4 text-center border-0">
               <div className="avatar-lg bg-white rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold text-primary shadow-sm mb-2" style={{ width: '70px', height: '70px', fontSize: '1.8rem' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
               </div>
               <h5 className="text-white fw-bold mb-0">{user.name || "User"}</h5>
               <small className="text-white opacity-75">{user.role || "Standard User"}</small>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <label className="text-muted small fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '0.05em' }}>Contact Information</label>
                <div className="d-flex align-items-center gap-3 mb-3 p-2 bg-light rounded-3">
                  <FiMail className="text-primary opacity-75" />
                  <div className="text-dark small fw-medium">{user.email || "No email available"}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="text-muted small fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '0.05em' }}>Organizational Detail</label>
                <div className="d-flex align-items-center gap-3 mb-3 p-2 bg-light rounded-3">
                  <FiTarget className="text-primary opacity-75" />
                  <div className="text-dark small fw-medium">{user.department || "General Department"}</div>
                </div>
                <div className="d-flex align-items-center gap-3 p-2 bg-light rounded-3">
                  <FiShield className="text-primary opacity-75" />
                  <div className="text-dark small fw-medium">{user.role || "User"} Permissions Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="col-lg-7 col-xl-8">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4 p-md-5">
              <h5 className="card-title fw-bold mb-4 d-flex align-items-center outfit-font">
                <FiLock className="me-2 text-primary" /> Security & Password
              </h5>
              <p className="text-muted small mb-4">You should update your password regularly to keep your account protection strong.</p>

              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary text-uppercase" style={{ fontSize: '11px' }}>Current Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><FiLock size={14} className="text-muted" /></span>
                    <input type="password" className={`form-control bg-light border-0 py-2 ${errors.current ? "is-invalid" : ""}`} placeholder="••••••••" name="current" value={passwordData.current} onChange={handlePasswordChange} />
                  </div>
                  {errors.current && <div className="invalid-feedback d-block small mt-1">{errors.current}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary text-uppercase" style={{ fontSize: '11px' }}>New Password</label>
                  <input type="password" className={`form-control bg-light border-0 py-2 ${errors.new ? "is-invalid" : ""}`} placeholder="Min 4 characters" name="new" value={passwordData.new} onChange={handlePasswordChange} />
                  {errors.new && <div className="invalid-feedback d-block small mt-1">{errors.new}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary text-uppercase" style={{ fontSize: '11px' }}>Confirm New Password</label>
                  <input type="password" className={`form-control bg-light border-0 py-2 ${errors.confirm ? "is-invalid" : ""}`} placeholder="Repeat new password" name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} />
                  {errors.confirm && <div className="invalid-feedback d-block small mt-1">{errors.confirm}</div>}
                </div>
              </div>
              
              <div className="d-flex justify-content-end">
                <button onClick={handlePasswordSave} className="btn btn-primary px-5 fw-bold py-2.5 shadow-sm rounded-3" disabled={saving}>
                  {saving ? "Updating..." : "Secure My Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
