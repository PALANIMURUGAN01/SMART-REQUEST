import { useEffect, useState, useCallback } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiAlertCircle,
  FiTool,
  FiActivity,
  FiUser,
  FiSearch,
  FiArrowRight,
  FiTarget
} from "react-icons/fi";
import { getBadgeClass, getPriorityBadgeClass } from "../utils/statusUtils";
import AdminChatDesk from "../components/AdminChatDesk";
import { API_URL } from "../config";

export default function StaffDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("tasks");
  const [showDetail, setShowDetail] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);

  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showResolveBox, setShowResolveBox] = useState(false);
  const [resolveMessage, setResolveMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusColors = user?.preferences?.statusColors;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (user?._id) {
        const assignedRes = await fetch(`${API_URL}/assigned-requests/${user._id}`);
        if (assignedRes.ok) data = await assignedRes.json();
      }
      setRequests(data || []);
    } catch (err) {
      console.error("Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) loadRequests();
  }, [loadRequests, user?._id]);

  async function updateStatus(requestId, newStatus, reason = null, resolveText = null) {
    try {
      const body = { status: newStatus };
      if (reason) body.rejectionReason = reason;
      if (resolveText) body.resolutionMessage = resolveText;

      const res = await fetch(`${API_URL}/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed update");
      const updated = await res.json();

      setRequests((prev) => prev.map((r) => (r._id === requestId ? updated : r)));
      if (activeRequest && activeRequest._id === requestId) setActiveRequest(updated);
      return true;
    } catch (err) { return false; }
  }

  const submitResolution = async () => {
    if (!resolveMessage.trim()) return alert("Enter details");
    setIsSubmitting(true);
    if (await updateStatus(activeRequest._id, "Resolved", null, resolveMessage)) {
      setShowResolveBox(false);
      setResolveMessage("");
      setShowDetail(false);
    }
    setIsSubmitting(false);
  };

  const submitRejection = async () => {
    if (!rejectReason.trim()) return alert("Enter reason");
    setIsSubmitting(true);
    if (await updateStatus(activeRequest._id, "Rejected", rejectReason)) {
      setShowRejectBox(false);
      setRejectReason("");
      setShowDetail(false);
    }
    setIsSubmitting(false);
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    active: requests.filter((r) => r.status === "In Progress").length,
    resolved: requests.filter((r) => r.status === "Resolved" || r.status === "Approved").length,
  };

  const filtered = requests.filter((r) => {
    const matchesSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.requestId?.toString().includes(searchQuery);
    if (!matchesSearch) return false;
    if (filter === "pending") return r.status === "Pending";
    if (filter === "active") return r.status === "In Progress";
    if (filter === "resolved") return r.status === "Resolved" || r.status === "Approved";
    return true;
  }).sort((a, b) => (b.requestId || 0) - (a.requestId || 0));

  function formatDate(t) {
    return new Date(t || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="container-fluid pt-3 pb-5 px-lg-5 animate-fade-in">
      {/* Personalized Identity Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-4 border-bottom pb-4">
        <div>
          <div className="d-flex align-items-center gap-3 mb-1">
            <div className="p-2.5 grad-indigo rounded-circle text-white shadow-sm"><FiUser size={22} /></div>
            <div>
              <h2 className="mb-0 fw-bold text-dark outfit-font">Welcome, {user.name || 'Faculty Member'}</h2>
              <p className="text-muted small mb-0">{user.department || 'General'} Department • Response Agent Dashboard</p>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2 p-1 bg-white border rounded-3 shadow-sm">
          {[
            { id: 'tasks', label: 'My Queue', icon: <FiTarget /> },
            { id: 'chats', label: 'Student Support', icon: <FiActivity /> }
          ].map(v => (
            <button key={v.id} className={`btn btn-sm px-4 py-2 rounded-2 border-0 fw-bold d-flex align-items-center gap-2 transition-all ${view === v.id ? 'grad-indigo text-white shadow-sm' : 'btn-light text-muted'}`} onClick={() => setView(v.id)}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "chats" && (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden animate-up" style={{ height: '700px' }}>
          <AdminChatDesk />
        </div>
      )}

      {view === "tasks" && (
        <div className="animate-up">
          {/* Performance metrics */}
          <div className="row g-4 mb-5">
            {[
              { label: "Total Assigned", val: stats.total, color: "indigo", icon: <FiFileText />, k: "all" },
              { label: "New Tasks", val: stats.pending, color: "amber", icon: <FiClock />, k: "pending" },
              { label: "Currently Active", val: stats.active, color: "primary", icon: <FiRefreshCw />, k: "active" },
              { label: "Success Rate", val: stats.resolved, color: "emerald", icon: <FiCheckCircle />, k: "resolved" }
            ].map(s => (
              <div key={s.label} className="col-sm-6 col-md-3">
                <div className={`clean-card p-4 border-bottom border-4 border-${s.color} cursor-pointer transition-all ${filter === s.k ? 'shadow-lg border-opacity-100 scale-102' : 'border-opacity-10 shadow-sm'}`} onClick={() => setFilter(s.k)}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>{s.label}</div>
                      <div className="h3 fw-bold text-dark outfit-font mb-0">{s.val}</div>
                    </div>
                    <div className={`p-2.5 rounded-3 bg-${s.color} bg-opacity-10 text-${s.color}`}><div style={{ transform: s.k === 'active' && loading ? 'rotate(360deg)' : 'none', transition: '0.3s' }}>{s.icon}</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
            <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
              <div className="flex-grow-1 position-relative">
                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input className="form-control border-0 bg-light py-2 ps-5 rounded-3 fw-medium" placeholder="Search my assigned queue (Title, ID)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <button className="btn btn-outline-primary btn-sm px-3 rounded-pill fw-bold border-2" onClick={loadRequests}>
                <FiRefreshCw className={`me-1 ${loading ? 'spin' : ''}`} /> Force Sync
              </button>
            </div>

            <div className="table-responsive">
              <table className="table hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="small fw-bold text-uppercase text-muted" style={{ fontSize: '11px' }}>
                    <th className="ps-4">S.No</th>
                    <th>Request ID</th>
                    <th>Details & Context</th>
                    <th>Priority</th>
                    <th>Current Status</th>
                    <th className="text-end pe-4">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-5 text-muted fw-medium">No tasks found in this category.</td></tr>
                  ) : (
                    filtered.map((r, index) => (
                      <tr key={r._id} className="cursor-pointer row-interactive" onClick={() => { setActiveRequest(r); setShowDetail(true); }}>
                        <td className="ps-4 fw-bold text-muted" style={{ width: '60px' }}>{index + 1}</td>
                        <td className="fw-bold text-primary">{r.requestId}</td>
                        <td>
                          <div className="fw-bold text-dark mb-1">{r.title}</div>
                          <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>{r.description}</div>
                        </td>
                        <td><span className={`badge rounded-pill px-3 py-1.5 ${getPriorityBadgeClass(r.priority)}`}>{r.priority}</span></td>
                        <td><span className={`badge rounded-pill px-3 py-1.5 ${getBadgeClass(r.status, statusColors)}`}>{r.status || 'Pending'}</span></td>
                        <td className="text-end pe-4">
                          <div className="d-flex gap-2 justify-content-end" onClick={e => e.stopPropagation()}>
                            {r.status === "Pending" && (
                              <>
                                <button className="btn btn-sm btn-info fw-bold rounded-2 px-3 shadow-sm border-0" onClick={() => updateStatus(r._id, "In Progress")}>Accept</button>
                                <button className="btn btn-sm btn-outline-danger fw-bold rounded-2 px-3" onClick={() => { setActiveRequest(r); setShowRejectBox(true); }}>Reject</button>
                              </>
                            )}
                            {r.status === "In Progress" && (
                              <button className="btn btn-sm btn-success fw-bold rounded-2 px-3 shadow-sm border-0" onClick={() => { setActiveRequest(r); setShowResolveBox(true); }}>Resolve</button>
                            )}
                            <button className="btn btn-sm btn-light border shadow-sm rounded-circle p-2" onClick={() => { setActiveRequest(r); setShowDetail(true); }}><FiArrowRight /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal Overhaul */}
      {showDetail && activeRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowDetail(false)}>
          <div className="card border-0 shadow-lg rounded-4 animate-up" style={{ width: '92%', maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3 className="fw-bold text-dark outfit-font mb-1">{activeRequest.title}</h3>
                  <div className="text-muted fw-bold small">ID: {activeRequest.requestId}</div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  <span className={`badge rounded-pill ${getBadgeClass(activeRequest.status, statusColors)} px-4 py-2`}>{activeRequest.status}</span>
                  <span className={`badge rounded-pill ${getPriorityBadgeClass(activeRequest.priority)} px-4 py-2 opacity-75`}>{activeRequest.priority}</span>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 mb-5 border-start border-primary border-4">
                <p className="text-dark fw-bold mb-0" style={{ fontSize: '1.05rem' }}>{activeRequest.description}</p>
              </div>

              <div className="row g-4 mb-5 border-top pt-4">
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Timeline</div>
                  <div className="fw-bold text-dark small">{formatDate(activeRequest.createdAt)}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Category</div>
                  <div className="fw-bold text-dark small">{activeRequest.department || activeRequest.category || 'Specialist Task'}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Assigned Specialist</div>
                  <div className="fw-bold text-dark text-uppercase small">{activeRequest.assignedTo?.name || 'Pending'}</div>
                </div>
              </div>

              {/* Action Center - Compact and White Background */}
              <div className="p-3 bg-white rounded-3 border mb-4 shadow-sm text-center">
                 <div className="d-flex gap-2 justify-content-center">
                    {activeRequest.status === "Pending" && (
                       <>
                          <button className="btn btn-primary btn-sm px-4 py-2 fw-bold grad-indigo border-0 shadow text-white" onClick={() => { updateStatus(activeRequest._id, "In Progress"); setShowDetail(false); }}>Accept Work</button>
                          <button className="btn btn-white btn-sm border px-4 py-2 fw-bold" onClick={() => setShowRejectBox(true)}>Reject</button>
                       </>
                    )}
                    {activeRequest.status === "In Progress" && (
                       <button className="btn btn-success btn-sm px-5 py-2 fw-bold grad-emerald border-0 shadow text-white" onClick={() => setShowResolveBox(true)}>Mark Task as Resolved</button>
                    )}
                    {(activeRequest.status === "Resolved" || activeRequest.status === "Approved" || activeRequest.status === "Rejected") && (
                       <div className="text-muted small fw-bold text-uppercase py-1">Task Finalized</div>
                    )}
                 </div>
              </div>

              <div className="d-flex justify-content-end">
                <button className="btn px-5 py-2.5 fw-bold text-white rounded-3 shadow border-0" style={{ backgroundColor: '#5c6c7c' }} onClick={() => setShowDetail(false)}>Close Overview</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolveBox && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in" style={{ zIndex: 3000, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="card border-0 shadow-lg rounded-4 animate-up" style={{ width: '92%', maxWidth: 500 }}>
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mb-3" style={{ width: "60px", height: "60px" }}><FiTool size={26} /></div>
                <h4 className="fw-bold text-dark mb-1">Task Resolution</h4>
                <p className="text-muted small mb-0">Record how this request was resolved for documentation.</p>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">RESOLUTION SUMMARY</label>
                <textarea className="form-control border-0 bg-light p-3 rounded-3" rows="4" placeholder="Briefly explain the resolution steps..." value={resolveMessage} onChange={(e) => setResolveMessage(e.target.value)}></textarea>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-light flex-grow-1 fw-bold py-2.5 border-0" onClick={() => { setShowResolveBox(false); setShowDetail(false); }} disabled={isSubmitting}>Dismiss</button>
                <button className="btn btn-success flex-grow-1 fw-bold py-2.5 grad-emerald border-0 shadow" onClick={submitResolution} disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Complete Task"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }.scale-102 { transform: scale(1.02); }`}</style>
    </div>
  );
}
