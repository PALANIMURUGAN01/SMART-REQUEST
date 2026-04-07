import { useEffect, useState, useCallback } from "react";
import { FiEye, FiEdit2, FiTrash2, FiSearch, FiFilter, FiPlus, FiCheckCircle, FiClock, FiActivity, FiXCircle, FiCalendar } from "react-icons/fi";
import { getBadgeClass, getPriorityBadgeClass } from "../utils/statusUtils";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "", priority: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const statusColors = user?.preferences?.statusColors;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!user?._id) throw new Error("Authentication required");
      const res = await fetch(`${API_URL}/user-requests/${user._id}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Could not load your requests.");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    let filtered = [...requests];
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(q) || 
        r.requestId?.toString().includes(q) ||
        r.category?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") {
        filtered = filtered.filter(r => (r.status || "Pending").toLowerCase() === filterStatus.toLowerCase());
    }
    setFilteredRequests(filtered);
  }, [requests, search, filterStatus]);

  const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'Pending').length,
      resolved: requests.filter(r => r.status === 'Resolved' || r.status === 'Approved').length,
      rejected: requests.filter(r => r.status === 'Rejected').length
  };

  function openDetails(req) {
    setActiveRequest(req);
    setShowDetail(true);
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
      const res = await fetch(`${API_URL}/requests/${activeRequest._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update request");
      setRequests(prev => prev.map(r => r._id === activeRequest._id ? { ...r, ...editForm } : r));
      setShowEdit(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Permanent Action: Are you sure you want to delete this digital request?")) return;
    try {
      const res = await fetch(`${API_URL}/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete request");
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function formatDate(t) {
    if (!t) return '---';
    return new Date(t).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="container-fluid pt-3 pb-5 px-lg-5 animate-fade-in">
      {/* Header Area */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-4">
        <div>
          <h2 className="mb-0 fw-bold text-primary outfit-font">My Activity</h2>
          <p className="text-muted small mb-0">Review status and manage your personal service submissions</p>
        </div>
        <button className="btn btn-primary px-4 fw-bold shadow-sm grad-indigo border-0 rounded-3 d-flex align-items-center" onClick={() => navigate("/dashboard")}>
           <FiPlus className="me-2" /> New Request
        </button>
      </div>

      {/* Mini Dashboard Stats */}
      <div className="row g-3 mb-5">
         {[
            { label: "Total History", val: stats.total, color: "indigo", icon: <FiActivity /> },
            { label: "Pending Review", val: stats.pending, color: "amber", icon: <FiClock /> },
            { label: "Successfully Resolved", val: stats.resolved, color: "emerald", icon: <FiCheckCircle /> },
            { label: "Rejected History", val: stats.rejected, color: "rose", icon: <FiXCircle /> }
         ].map(s => (
             <div key={s.label} className="col-md-3">
                <div className={`card border-0 shadow-sm rounded-4 p-3 card-accent-${s.color}`}>
                   <div className="d-flex justify-content-between align-items-center">
                      <div>
                         <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '10px' }}>{s.label}</div>
                         <div className="h4 fw-bold mb-0 text-dark outfit-font mt-1">{s.val}</div>
                      </div>
                      <div className={`p-2 bg-${s.color} bg-opacity-10 text-${s.color} rounded-circle`}>{s.icon}</div>
                   </div>
                </div>
             </div>
         ))}
      </div>

      {/* Advanced Toolbar */}
      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
        <div className="card-body bg-light p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group bg-white rounded-3 overflow-hidden border">
                <span className="input-group-text bg-white border-0"><FiSearch size={14} className="text-muted" /></span>
                <input type="text" className="form-control border-0 shadow-none small" placeholder="Search my requests..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
                <div className="input-group bg-white rounded-3 overflow-hidden border">
                    <span className="input-group-text bg-white border-0"><FiFilter size={14} className="text-muted" /></span>
                    <select className="form-select border-0 shadow-none small fw-bold" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
      {error && <div className="alert alert-danger rounded-4 border-0 shadow-sm mb-4">{error}</div>}

      {!loading && !error && filteredRequests.length === 0 && (
        <div className="card border-0 shadow-sm p-5 text-center rounded-4">
          <FiActivity size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-dark fw-bold">No Records Found</h5>
          <p className="text-muted mb-0">Start by submitting your first request from the dashboard.</p>
        </div>
      )}

      {/* Optimized Data List */}
      {!loading && !error && filteredRequests.length > 0 && (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table align-middle hover mb-0">
              <thead className="bg-light border-bottom">
                <tr>
                  <th className="ps-4 py-3 small fw-bold text-uppercase text-muted text-center" style={{ width: 80 }}>ID</th>
                  <th className="py-3 small fw-bold text-uppercase text-muted">Request Information</th>
                  <th className="py-3 small fw-bold text-uppercase text-muted">Status</th>
                  <th className="py-3 small fw-bold text-uppercase text-muted">Priority</th>
                  <th className="pe-4 py-3 text-end small fw-bold text-uppercase text-muted" style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r._id} className="cursor-pointer" onClick={() => openDetails(r)}>
                    <td className="ps-4 text-center fw-bold text-primary">{r.requestId}</td>
                    <td>
                      <div className="fw-bold text-dark">{r.title}</div>
                      <div className="small text-muted d-flex align-items-center gap-2" style={{ fontSize: '11px' }}>
                         <FiCalendar size={10} /> {formatDate(r.createdAt)}
                      </div>
                    </td>
                    <td><span className={`badge rounded-pill shadow-sm px-3 ${getBadgeClass(r.status, statusColors)}`}>{r.status || "Pending"}</span></td>
                    <td><span className={`badge rounded-pill px-3 ${getPriorityBadgeClass(r.priority)}`}>{r.priority || "Low"}</span></td>
                    <td className="pe-4 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-white border shadow-sm p-1.5 rounded-circle text-primary" onClick={(e) => { e.stopPropagation(); openDetails(r); }} title="View"><FiEye size={16} /></button>
                        <button className="btn btn-sm btn-white border shadow-sm p-1.5 rounded-circle text-amber" onClick={(e) => { e.stopPropagation(); openEdit(r); }} title="Edit"><FiEdit2 size={16} /></button>
                        <button className="btn btn-sm btn-white border shadow-sm p-1.5 rounded-circle text-rose" onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }} title="Delete"><FiTrash2 size={16} /></button>
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
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowDetail(false)}>
          <div className="card shadow-lg border-0 rounded-4 animate-up" style={{ width: '92%', maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3 className="fw-bold text-dark text-uppercase mb-1 outfit-font" style={{ fontSize: '1.4rem' }}>{activeRequest.title}</h3>
                  <div className="text-muted fw-bold small">REQUEST ID: {activeRequest.requestId}</div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  <span className={`badge rounded-pill ${getBadgeClass(activeRequest.status, statusColors)} px-4 py-2`}>{activeRequest.status || 'Pending'}</span>
                  <span className={`badge rounded-pill ${getPriorityBadgeClass(activeRequest.priority)} px-4 py-2 opacity-75`}>{activeRequest.priority}</span>
                </div>
              </div>

              <p className="text-dark fw-medium p-3 bg-light rounded-3 mb-5 border-start border-primary border-4" style={{ fontSize: '15px' }}>{activeRequest.description}</p>

              <div className="row g-4 mb-5 border-top pt-4">
                {[
                    { label: "Category", val: activeRequest.department || activeRequest.category || 'General' },
                    { label: "Date Submitted", val: formatDate(activeRequest.createdAt) },
                    { label: "Assigned Specialist", val: activeRequest.assignedTo?.name || activeRequest.assignedTo || 'Pending Assignment' }
                ].map(info => (
                    <div key={info.label} className="col-md-4">
                        <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>{info.label}</div>
                        <div className="fw-bold text-dark text-uppercase" style={{ fontSize: '14px' }}>{info.val}</div>
                    </div>
                ))}
              </div>

              {activeRequest.status === "Rejected" && activeRequest.rejectionReason && (
                <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3">
                  <div className="text-danger small fw-bold text-uppercase mb-1" style={{ fontSize: '11px' }}>Rejection Remark</div>
                  <p className="mb-0 text-dark small fw-medium">{activeRequest.rejectionReason}</p>
                </div>
              )}

              {activeRequest.status === "Resolved" && activeRequest.resolutionMessage && (
                <div className="mb-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3">
                   <div className="text-success small fw-bold text-uppercase mb-1" style={{ fontSize: '11px' }}>Resolution Detail</div>
                   <p className="mb-0 text-dark small fw-medium">{activeRequest.resolutionMessage}</p>
                </div>
              )}

              <div className="d-flex justify-content-end">
                <button className="btn px-5 py-2.5 fw-bold text-white rounded-3 shadow border-0" style={{ backgroundColor: '#5c6c7c' }} onClick={() => setShowDetail(false)}>Close Activity</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && activeRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowEdit(false)}>
          <div className="card shadow-lg border-0 rounded-4" style={{ width: '92%', maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <h4 className="fw-bold mb-4 text-dark outfit-font">Update Request Details</h4>
              <div className="mb-3"><label className="form-label small fw-bold text-uppercase text-muted">Title</label><input className="form-control bg-light border-0 py-2" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div className="row g-3 mb-4"><div className="col-md-6"><label className="form-label small fw-bold text-uppercase text-muted">Priority</label><select className="form-select bg-light border-0" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></div></div>
              <div className="mb-4"><label className="form-label small fw-bold text-uppercase text-muted">Description</label><textarea className="form-control bg-light border-0" rows="4" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}></textarea></div>
              <div className="d-flex justify-content-end gap-2"><button className="btn btn-light px-4 fw-bold" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-primary px-4 fw-bold grad-indigo border-0" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Updates"}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
