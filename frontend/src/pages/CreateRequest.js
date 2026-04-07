import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLayers, FiAlertCircle, FiFileText, FiUpload, FiSend, FiXCircle, FiCheckCircle } from "react-icons/fi";
import { DEPARTMENTS } from "../constants/departments";
import { API_URL } from "../config";

export default function CreateRequest() {
   const [title, setTitle] = useState("");
   const [department, setDepartment] = useState(DEPARTMENTS[0]);
   const [priority, setPriority] = useState("Low");
   const [description, setDescription] = useState("");
   const [file, setFile] = useState(null);
   const [submitting, setSubmitting] = useState(false);
   const [success, setSuccess] = useState("");
   const [errors, setErrors] = useState({});
   const navigate = useNavigate();

   const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile && selectedFile.size > 8 * 1024 * 1024) {
         setErrors({ ...errors, file: "File size must be less than 8MB" });
         return;
      }
      setFile(selectedFile);
      setErrors({ ...errors, file: null });
   };

   const validate = () => {
      let newErrors = {};
      if (!title.trim()) newErrors.title = "Required";
      if (!description.trim()) newErrors.description = "Required";
      if (description.length < 10) newErrors.description = "Too short";
      return newErrors;
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
         setErrors(validationErrors);
         return;
      }

      setSubmitting(true);
      setErrors({});

      try {
         const user = JSON.parse(localStorage.getItem("user") || "{}");
         const formData = new FormData();
         formData.append("title", title);
         formData.append("department", department);
         formData.append("priority", priority);
         formData.append("description", description);
         if (file) formData.append("file", file);
         formData.append("ownerEmail", user.email || "anonymous@example.com");
         formData.append("createdBy", user._id || "");

         const res = await fetch(`${API_URL}/requests`, {
            method: "POST",
            body: formData,
         });

         if (!res.ok) throw new Error("Submission failed");

         setSuccess("Request submitted!");
         setTitle("");
         setDescription("");
         setFile(null);
         setPriority("Low");

         setTimeout(() => {
            navigate("/my-requests");
         }, 1500);
      } catch (err) {
         setErrors({ submit: err.message });
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <div className="container-fluid pt-1 pb-2 px-lg-5 animate-fade-in" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
         {/* Top Header Section */}
         <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-3 border-bottom pb-2">
            <div>
               <h1 className="mb-1 fw-bold text-dark outfit-font" style={{ fontSize: '1.7rem' }}>New Request</h1>
               <p className="text-muted small mb-0">Submit a new ticket for support or services</p>
            </div>
         </div>

         <div className="w-100 h-100">

            <div className="card glass-card shadow-lg border-0 rounded-4 overflow-hidden card-interactive" style={{ maxHeight: 'calc(100vh - 160px)' }}>
               <div className="card-body p-3">
                  {success && (
                     <div className="alert alert-success border-0 shadow-sm mb-3 d-flex align-items-center py-2 px-3 animate-fade-in" role="alert" style={{ borderRadius: '10px' }}>
                        <FiCheckCircle className="me-2 fs-5" />
                        <div className="fw-medium small">{success}</div>
                     </div>
                  )}

                  {errors.submit && (
                     <div className="alert alert-danger border-0 shadow-sm mb-3 d-flex align-items-center py-2 px-3 animate-fade-in" role="alert" style={{ borderRadius: '10px' }}>
                        <FiXCircle className="me-2 fs-5" />
                        <div className="fw-medium small">{errors.submit}</div>
                     </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate>
                     <div className="row g-3 mb-3">
                        <div className="col-md-6">
                           <label className="form-label small fw-bold text-uppercase mb-1" style={{ color: 'var(--primary-color)', letterSpacing: '0.04em' }}>
                              <FiFileText className="me-2" size={14} /> Title
                           </label>
                           <input
                              className={`form-control border-0 shadow-sm ${errors.title ? "is-invalid" : ""}`}
                              placeholder="Enter a descriptive title"
                              style={{ borderRadius: '10px', height: '44px', fontSize: '0.95rem' }}
                              value={title}
                              onChange={(ev) => setTitle(ev.target.value)}
                              disabled={submitting}
                           />
                        </div>
                        <div className="col-md-6">
                           <label className="form-label small fw-bold text-uppercase mb-1" style={{ color: 'var(--primary-color)', letterSpacing: '0.04em' }}>
                              <FiLayers className="me-2" size={14} /> Department
                           </label>
                           <select
                              className="form-select border-0 shadow-sm"
                              style={{ borderRadius: '10px', height: '44px', fontSize: '0.95rem' }}
                              value={department}
                              onChange={(ev) => setDepartment(ev.target.value)}
                              disabled={submitting}
                           >
                              {DEPARTMENTS.map(dept => (
                                 <option key={dept} value={dept}>{dept}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     <div className="row g-3 mb-3">
                        <div className="col-md-12">
                           <label className="form-label small fw-bold text-uppercase mb-1" style={{ color: 'var(--primary-color)', letterSpacing: '0.04em' }}>
                              <FiAlertCircle className="me-2" size={14} /> Priority & Details
                           </label>
                           <div className="d-flex gap-2 mb-2">
                              {['Low', 'Medium', 'High'].map(p => (
                                 <button
                                    key={p}
                                    type="button"
                                    className={`btn btn-sm flex-fill fw-bold py-2 ${priority === p ? 'grad-indigo border-0 text-white shadow-sm' : 'btn-outline-secondary border text-secondary'}`}
                                    style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                    onClick={() => setPriority(p)}
                                    disabled={submitting}
                                 >
                                    {p}
                                 </button>
                              ))}
                           </div>
                           <textarea
                              className={`form-control border-0 shadow-sm px-3 py-2 ${errors.description ? "is-invalid" : ""}`}
                              style={{ borderRadius: '10px', resize: 'none', height: '90px', fontSize: '0.95rem' }}
                              placeholder="Provide a detailed description of your request..."
                              value={description}
                              onChange={(ev) => setDescription(ev.target.value)}
                              disabled={submitting}
                           ></textarea>
                        </div>
                     </div>

                     {/* File Upload Compact */}
                     <div className="mb-3">
                        <div
                           className={`position-relative border-2 border-dashed rounded-3 p-2 d-flex align-items-center justify-content-center transition-all bg-light bg-opacity-25 ${file ? 'border-primary bg-primary-subtle bg-opacity-10' : 'border-secondary-subtle'}`}
                           style={{ cursor: 'pointer', height: '60px' }}
                        >
                           <input
                              type="file"
                              className="position-absolute w-100 h-100 top-0 start-0 opacity-0 cursor-pointer"
                              style={{ zIndex: 10 }}
                              onChange={handleFileChange}
                              disabled={submitting}
                           />
                           <div className="d-flex align-items-center gap-2">
                              {file ? (
                                 <><FiCheckCircle className="text-primary" size={18} /> <span className="small fw-bold text-primary text-truncate" style={{ maxWidth: '100%' }}>{file.name}</span></>
                              ) : (
                                 <><FiUpload className="text-secondary" size={18} /> <span className="fw-medium text-secondary small">Attach file <span className="text-muted fw-normal">(Optional, Max 8MB)</span></span></>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="d-grid">
                        <button
                           type="submit"
                           className="btn grad-indigo btn-lg fw-bold py-1.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border-0"
                           style={{ fontSize: '1rem', height: '48px' }}
                           disabled={submitting}
                        >
                           {submitting ? (
                              <><span className="spinner-border spinner-border-sm"></span> Processing...</>
                           ) : (
                              <><FiSend size={18} /> Submit Request</>
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         </div>
      </div>
   );
}
