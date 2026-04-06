import { useState } from "react";
import { FiUser, FiMail, FiPhone, FiBriefcase, FiCheckCircle } from "react-icons/fi";
import { DEPARTMENTS } from "../constants/departments";

export default function Profile() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [successMessage, setSuccessMessage] = useState("");
    const [formData, setFormData] = useState({
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: "" });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user._id) return;

        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/users/${user._id}`, {
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

            // Sync localStorage
            localStorage.setItem("user", JSON.stringify(updatedUser));

            setSuccessMessage("✅ Profile updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="container-fluid pt-3 pb-4 px-lg-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
                <div>
                    <h2 className="mb-1 fw-bold text-primary">My Profile</h2>
                    <p className="text-muted small mb-0">Manage your personal information and contact details</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle px-3 py-2 rounded-pill text-uppercase small fw-bold shadow-sm">
                        Current Role: {user.role || "User"}
                    </span>
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary border border-primary-subtle shadow-sm">
                        <FiUser size={20} />
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    {successMessage && (
                        <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center">
                            <FiCheckCircle className="me-2" /> {successMessage}
                        </div>
                    )}

                    <div className="card border-0 shadow-sm overflow-hidden rounded-4">
                        <div className="card-header bg-white py-4 px-4 border-0">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <FiUser className="me-2 text-primary" /> Personal Information
                            </h5>
                        </div>
                        <div className="card-body p-4 pt-0">
                            <form onSubmit={handleSave}>
                                <div className="row g-4">
                                    <div className="col-md-12">
                                        <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Full Name</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiUser className="text-muted" /></span>
                                            <input
                                                type="text"
                                                className={`form-control py-2 ${errors.fullName ? "is-invalid" : ""}`}
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {errors.fullName && <div className="invalid-feedback d-block">{errors.fullName}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Email Address</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiMail className="text-muted" /></span>
                                            <input
                                                type="email"
                                                className={`form-control py-2 ${errors.email ? "is-invalid" : ""}`}
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Phone Number</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiPhone className="text-muted" /></span>
                                            <input
                                                type="tel"
                                                className="form-control py-2"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Department / Role</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><FiBriefcase className="text-muted" /></span>
                                            <select
                                                className="form-control py-2"
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Department</option>
                                                {DEPARTMENTS.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2">
                                    <button type="submit" className="btn btn-primary px-5 fw-bold py-2 rounded-3 shadow-sm">
                                        Save Changes
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
