import { useState } from "react";
import { FiSettings, FiLock, FiBell, FiCheckCircle } from "react-icons/fi";

export default function Settings() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Standardize initialization
  const getInitialPreferences = () => {
    const prefs = user.preferences || {};
    return {
      notifications: prefs.notifications ?? true,
      emailAlerts: prefs.emailAlerts ?? true,
      soundAlerts: prefs.soundAlerts ?? false
    };
  };

  const [formData, setFormData] = useState(getInitialPreferences());

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

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

  const handleSavePreferences = async () => {
    if (!user._id) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: formData
        }),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      const updatedUser = await res.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSuccessMessage("✅ Preferences saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
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
      const res = await fetch(`http://localhost:5000/users/${user._id}`, {
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
    <div className="container-fluid pt-3 pb-4 px-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h2 className="mb-1 fw-bold text-primary">Settings & Security</h2>
          <p className="text-muted small mb-0">Manage your account protection and app preferences</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary border border-primary-subtle">
            <FiSettings size={20} />
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center">
          <FiCheckCircle className="me-2" /> {successMessage}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Security */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4 d-flex align-items-center">
                <FiLock className="me-2 text-primary" /> Security Settings
              </h5>
              <p className="text-muted small mb-4">Keep your account secure by using a strong password.</p>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">CURRENT PASSWORD</label>
                <input type="password" className={`form-control py-2 ${errors.current ? "is-invalid" : ""}`} placeholder="••••••••" name="current" value={passwordData.current} onChange={handlePasswordChange} />
                {errors.current && <div className="invalid-feedback d-block">{errors.current}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">NEW PASSWORD</label>
                <input type="password" className={`form-control py-2 ${errors.new ? "is-invalid" : ""}`} placeholder="Min 4 characters" name="new" value={passwordData.new} onChange={handlePasswordChange} />
                {errors.new && <div className="invalid-feedback d-block">{errors.new}</div>}
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary">CONFIRM NEW PASSWORD</label>
                <input type="password" className={`form-control py-2 ${errors.confirm ? "is-invalid" : ""}`} placeholder="Repeat new password" name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} />
                {errors.confirm && <div className="invalid-feedback d-block">{errors.confirm}</div>}
              </div>
              <button onClick={handlePasswordSave} className="btn btn-primary w-100 fw-bold py-2 shadow-sm rounded-3">
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4 d-flex align-items-center">
                <FiBell className="me-2 text-primary" /> Notification Preferences
              </h5>
              <div className="form-check form-switch mb-3 p-2 bg-light rounded-3 d-flex justify-content-between align-items-center ps-5">
                <label className="form-check-label fw-medium mb-0" htmlFor="notifSwitch">In-App Notifications</label>
                <input className="form-check-input" type="checkbox" name="notifications" id="notifSwitch" checked={formData.notifications} onChange={handleChange} />
              </div>
              <div className="form-check form-switch mb-3 p-2 bg-light rounded-3 d-flex justify-content-between align-items-center ps-5">
                <label className="form-check-label fw-medium mb-0" htmlFor="emailSwitch">Email Alerts</label>
                <input className="form-check-input" type="checkbox" name="emailAlerts" id="emailSwitch" checked={formData.emailAlerts} onChange={handleChange} />
              </div>
              <div className="form-check form-switch mb-4 p-2 bg-light rounded-3 d-flex justify-content-between align-items-center ps-5">
                <label className="form-check-label fw-medium mb-0" htmlFor="soundSwitch">Sound Alerts</label>
                <input className="form-check-input" type="checkbox" name="soundAlerts" id="soundSwitch" checked={formData.soundAlerts} onChange={handleChange} />
              </div>
              <button onClick={handleSavePreferences} className="btn btn-outline-primary w-100 fw-bold py-2 rounded-3" disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
