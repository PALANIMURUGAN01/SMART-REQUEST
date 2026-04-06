import { useEffect, useState } from "react";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "", priority: "" });
  const [saving, setSaving] = useState(false);

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setError("No user session found.");
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      if (!user._id) throw new Error("Authentication required");

      const res = await fetch(`http://localhost:5000/user-requests/${user._id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = (user.email || "User").toLowerCase();
  const myRequests = requests;

  const getPriorityBadgeClass = (priority) => {
    const p = (priority || "low").toLowerCase();
    if (p === "high") return "badge rounded-pill bg-danger";
    if (p === "medium") return "badge rounded-pill bg-warning text-dark";
    return "badge rounded-pill bg-success";
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "approved" || s === "completed" || s === "resolved") return "badge rounded-pill bg-success";
    if (s === "in-progress") return "badge rounded-pill bg-info text-dark";
    if (s === "rejected") return "badge rounded-pill bg-danger";
    return "badge rounded-pill bg-warning text-dark"; // pending / open
  };

  function openDetails(req) {
    setActiveRequest(req);
    setShowDetail(true);
  }

  function closeDetails() {
    setActiveRequest(null);
    setShowDetail(false);
  }

  function openEdit(req) {
    setActiveRequest(req);
    setEditForm({
      title: req.title,
      description: req.description,
      category: req.category,
      priority: req.priority
    });
    setShowEdit(true);
  }

  async function saveEdit() {
    if (!activeRequest) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/requests/${activeRequest._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update request");

      // Update local state
      setRequests(prev => prev.map(r => r._id === activeRequest._id ? { ...r, ...editForm } : r));
      setShowEdit(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete request");

      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function formatDate(t) {
    return new Date(t || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h2 className="mb-1 fw-bold text-primary">My Requests</h2>
          <p className="text-muted small mb-0">Manage and track your submitted request history</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill border bg-white shadow-sm" style={{ fontSize: '13px' }}>
            <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '12px', fontWeight: 'bold' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="fw-bold">{user.name || currentUser}</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {error && <div className="alert alert-danger shadow-sm border-0">{error}</div>}

      {!loading && !error && myRequests.length === 0 && (
        <div className="card border-0 shadow-sm p-5 text-center">
          <div className="text-muted mb-3 opacity-50"><FiEye size={48} /></div>
          <h5 className="text-dark fw-bold">No requests found</h5>
          <p className="text-muted mb-0">You have not created any requests yet.</p>
        </div>
      )}

      {!loading && !error && myRequests.length > 0 && (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 fw-bold text-secondary small text-uppercase" style={{ width: 100 }}>Request ID</th>
                  <th className="fw-bold text-secondary small text-uppercase">Title</th>
                  <th className="fw-bold text-secondary small text-uppercase">Status</th>
                  <th className="fw-bold text-secondary small text-uppercase">Date</th>
                  <th className="fw-bold text-secondary small text-uppercase">Priority</th>
                  <th className="pe-4 fw-bold text-secondary small text-uppercase text-end" style={{ width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r, idx) => (
                  <tr key={r._id || r.id}>
                    <td className="ps-4">
                      <span className="fw-bold text-primary">{r.requestId || idx + 1}</span>
                    </td>
                    <td className="fw-semibold text-dark">{r.title}</td>
                    <td>
                      <span className={getStatusBadgeClass(r.status)}>{r.status || "Pending"}</span>
                    </td>
                    <td className="text-muted small">{formatDate(r.createdAt)}</td>
                    <td>
                      <span className={getPriorityBadgeClass(r.priority)}>{r.priority || "Low"}</span>
                    </td>
                    <td className="pe-4 text-end">
                      <div className="btn-group shadow-sm">
                        <button
                          className="btn btn-sm btn-outline-primary px-3"
                          onClick={() => openDetails(r)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-white border px-2 py-1"
                          onClick={() => openEdit(r)}
                          title="Edit Request"
                        >
                          <FiEdit2 className="text-secondary" />
                        </button>
                        <button
                          className="btn btn-sm btn-white border px-2 py-1"
                          onClick={() => handleDelete(r._id)}
                          title="Delete Request"
                        >
                          <FiTrash2 className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetail && activeRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={closeDetails}>
          <div className="card shadow-lg" style={{ width: '92%', maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1">{activeRequest.title}</h5>
                  <small className="text-muted">ID: {activeRequest.requestId || activeRequest._id || activeRequest.id}</small>
                </div>
                <div className="text-end">
                  <div><span className={getStatusBadgeClass(activeRequest.status)}>{activeRequest.status || 'Pending'}</span></div>
                  <div className="mt-2"><span className={getPriorityBadgeClass(activeRequest.priority)}>{activeRequest.priority || 'Low'}</span></div>
                </div>
              </div>

              <p className="text-muted">{activeRequest.description}</p>

              <div className="row g-2 mb-3">
                <div className="col-sm-4"><small className="text-muted">Category</small><div>{activeRequest.category || '-'}</div></div>
                <div className="col-sm-4"><small className="text-muted">Created</small><div>{formatDate(activeRequest.createdAt)}</div></div>
                <div className="col-sm-4"><small className="text-muted">Assigned To</small><div>{typeof activeRequest.assignedTo === 'object' ? (activeRequest.assignedTo?.name || '-') : (activeRequest.assignedTo || '-')}</div></div>
              </div>

              <div>
                <h6 className="mb-2">Attachments</h6>
                {activeRequest.attachmentUrl || activeRequest.attachments ? (
                  <ul>
                    {(activeRequest.attachments || [activeRequest.attachmentUrl]).filter(Boolean).map((a, i) => (
                      <li key={i}><a href={a} target="_blank" rel="noreferrer">{a}</a></li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted">No attachments</div>
                )}
              </div>

              <div className="mt-3 d-flex justify-content-end">
                <button className="btn btn-secondary px-4" onClick={closeDetails}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEdit && activeRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowEdit(false)}>
          <div className="card shadow-lg" style={{ width: '92%', maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Edit Request {activeRequest.requestId}</h5>

              <div className="mb-3">
                <label className="form-label small fw-bold text-uppercase text-muted">Title</label>
                <input
                  className="form-control"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Request title"
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted">Category</label>
                  <select
                    className="form-select"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option>Institute</option>
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Network</option>
                    <option>Maintenance</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted">Priority</label>
                  <select
                    className="form-select"
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase text-muted">Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Detailed description..."
                ></textarea>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary px-4" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary px-4" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
