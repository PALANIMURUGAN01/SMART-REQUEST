import { useState } from "react";
import { FiUser, FiMail, FiPhone, FiBriefcase, FiCheckCircle, FiCalendar, FiClock } from "react-icons/fi";
import { DEPARTMENTS } from "../constants/departments";
import { API_URL } from "../config";

export default function Profile() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [successMessage, setSuccessMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
    });

    const [errors, setErrors] = useState({});
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: "" });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user._id) return;
        setSaving(true);

        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSaving(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/users/${user._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    department: formData.department
                }),
            });

            if (!res.ok) throw new Error("Failed to update profile");
            const updatedUser = await res.json();
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setSuccessMessage("✅ Profile updated successfully!");
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
                    <h2 className="mb-1 fw-bold text-primary outfit-font">My Profile</h2>
                    <p className="text-muted small mb-0">Manage your personal identity and account information</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary border border-primary-subtle shadow-sm">
                        <FiUser size={20} />
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center rounded-3">
                    <FiCheckCircle className="me-2 text-success" /> {successMessage}
                </div>
            )}

            <div className="row g-4 justify-content-center">
                {/* Left Column: Avatar and Quick Stats */}
                <div className="col-lg-4 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                        <div className="card-body p-4 text-center">
                            <div className="position-relative d-inline-block mb-4">
                                <div className="avatar-xl bg-primary grad-indigo rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-lg mx-auto" style={{ width: '120px', height: '120px', fontSize: '3rem' }}>
                                    {initials}
                                </div>
                                <div className="position-absolute bottom-0 end-0 bg-white p-2 rounded-circle shadow-sm border" style={{ cursor: 'pointer' }}>
                                    <FiUser size={16} className="text-primary" />
                                </div>
                            </div>
                            <h4 className="fw-bold text-dark mb-1">{user.name || "User"}</h4>
                            <p className="text-muted small mb-4">{user.email}</p>
                            
                            <hr className="opacity-10" />
                            
                            <div className="text-start mt-4">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="icon-sm bg-light rounded-2 p-2 text-primary"><FiBriefcase /></div>
                                    <div><div className="text-muted small" style={{ fontSize: '11px' }}>ROLE</div><div className="fw-bold text-dark small">{user.role || "Standard User"}</div></div>
                                </div>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="icon-sm bg-light rounded-2 p-2 text-primary"><FiCalendar /></div>
                                    <div><div className="text-muted small" style={{ fontSize: '11px' }}>JOINED</div><div className="fw-bold text-dark small">{new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div></div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="icon-sm bg-light rounded-2 p-2 text-primary"><FiClock /></div>
                                    <div><div className="text-muted small" style={{ fontSize: '11px' }}>STATUS</div><div className="fw-bold text-success small">Verified Account</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Information Form */}
                <div className="col-lg-8 col-xl-7">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white py-4 px-5 border-0">
                            <h5 className="mb-0 fw-bold outfit-font text-dark d-flex align-items-center">
                                <span className="me-2 text-primary">📝</span> Edit Personal Details
                            </h5>
                        </div>
                        <div className="card-body px-5 pb-5 pt-0">
                            <form onSubmit={handleSave}>
                                <div className="row g-4">
                                    <div className="col-12">
                                        <label className="form-label small fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>Full Name</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiUser className="text-muted" /></span>
                                            <input type="text" className={`form-control bg-light border-0 py-2.5 fw-medium ${errors.fullName ? "is-invalid" : ""}`} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" />
                                        </div>
                                        {errors.fullName && <div className="invalid-feedback d-block mt-1 small">{errors.fullName}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>Email</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiMail className="text-muted" /></span>
                                            <input type="email" className={`form-control bg-light border-0 py-2.5 fw-medium ${errors.email ? "is-invalid" : ""}`} name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
                                        </div>
                                        {errors.email && <div className="invalid-feedback d-block mt-1 small">{errors.email}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>Phone</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiPhone className="text-muted" /></span>
                                            <input type="tel" className="form-control bg-light border-0 py-2.5 fw-medium" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label small fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>Department</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiBriefcase className="text-muted" /></span>
                                            <select className="form-select bg-light border-0 py-2.5 fw-medium" name="department" value={formData.department} onChange={handleChange}>
                                                <option value="">Select Department</option>
                                                {DEPARTMENTS.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 text-end">
                                    <button type="submit" className="btn btn-primary px-5 fw-bold py-2.5 rounded-3 shadow-lg border-0" disabled={saving}>
                                        {saving ? "Processing..." : "Update My Profile"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
