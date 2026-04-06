import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiPlay,
  FiXCircle,
  FiClock,
  FiFileText,
  FiTrendingUp,
  FiFilter,
  FiRefreshCw,
  FiChevronRight,
  FiUser,
  FiAlertCircle,
  FiMessageSquare,
} from "react-icons/fi";
import AdminChatDesk from "../components/AdminChatDesk";

export default function StaffDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("tasks");
  const [showDetail, setShowDetail] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      let data = [];
      if (user._id) {
        try {
          const assignedRes = await fetch(
            `http://localhost:5000/assigned-requests/${user._id}`
          );
          if (assignedRes.ok) {
            data = await assignedRes.json();
          }
        } catch {
          // ignore, will fallback
        }
      }
      if (!data || data.length === 0) {
        const allRes = await fetch("http://localhost:5000/requests");
        if (allRes.ok) {
          data = await allRes.json();
        }
      }
      setRequests(data || []);
    } catch (err) {
      setError("Unable to load requests. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line
  }, [user._id]);

  async function updateStatus(requestId, newStatus) {
    setUpdating(requestId);
    try {
      const res = await fetch(`http://localhost:5000/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? updated : r))
      );
      if (activeRequest && activeRequest._id === requestId) {
        setActiveRequest(updated);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  }

  function openDetails(req) {
    setActiveRequest(req);
    setShowDetail(true);
  }

  function closeDetails() {
    setActiveRequest(null);
    setShowDetail(false);
  }

  function formatDate(t) {
    if (!t) return "N/A";
    return new Date(t).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    inProgress: requests.filter((r) => r.status === "In Progress").length,
    resolved: requests.filter(
      (r) => r.status === "Resolved" || r.status === "Approved"
    ).length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
  };

  const filtered = (
    filter === "all"
      ? requests
      : requests.filter((r) => {
        if (filter === "pending") return r.status === "Pending";
        if (filter === "inProgress") return r.status === "In Progress";
        if (filter === "resolved")
          return r.status === "Resolved" || r.status === "Approved";
        if (filter === "rejected") return r.status === "Rejected";
        return true;
      })
  ).slice().sort((a, b) => (b.requestId || 0) - (a.requestId || 0));

  function getStatusBadge(status) {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "resolved")
      return "bg-success-subtle text-success border border-success-subtle";
    if (s === "in progress")
      return "bg-info-subtle text-info border border-info-subtle";
    if (s === "rejected")
      return "bg-danger-subtle text-danger border border-danger-subtle";
    return "bg-warning-subtle text-warning border border-warning-subtle";
  }

  function getPriorityBadge(priority) {
    if (priority === "High") return "bg-danger";
    if (priority === "Medium") return "bg-warning text-dark";
    return "bg-success";
  }

  const statCards = [
    { label: "Total", value: stats.total, icon: <FiFileText size={24} />, accent: "indigo", filterKey: "all" },
    { label: "Pending", value: stats.pending, icon: <FiClock size={24} />, accent: "amber", filterKey: "pending" },
    { label: "In Progress", value: stats.inProgress, icon: <FiPlay size={24} />, accent: "indigo", filterKey: "inProgress" },
    { label: "Resolved", value: stats.resolved, icon: <FiCheckCircle size={24} />, accent: "emerald", filterKey: "resolved" },
    { label: "Rejected", value: stats.rejected, icon: <FiXCircle size={24} />, accent: "rose", filterKey: "rejected" },
  ];

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h1 className="mb-0 fw-bold text-dark outfit-font" style={{ fontSize: '1.8rem' }}>Staff Dashboard</h1>
          <p className="text-muted small mb-0">Assigned Tasks & Performance Overview</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="btn-group shadow-sm bg-white rounded-3 p-1 border">
            <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${view === 'tasks' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setView('tasks')}>My Tasks</button>
            <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${view === 'chats' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setView('chats')}>Support Chats</button>
          </div>
          <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill border bg-white shadow-sm" style={{ fontSize: '13px' }}>
            <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '12px', fontWeight: 'bold' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
            </div>
            <div className="fw-bold">{user.name}</div>
          </div>
          <button className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm" onClick={loadRequests} disabled={loading}>
            <FiRefreshCw size={14} className={loading ? "spin-icon" : "me-1"} /> Refresh
          </button>
        </div>
      </div>

      {view === "chats" && (
        <div className="animate-fade-in">
          <AdminChatDesk />
        </div>
      )}

      {view === "tasks" && (
        <>
          {/* Stats Row */}
          <div className="row g-3 mb-4 animate-fade-in">
            {statCards.map((card) => (
              <div className="col" key={card.label}>
                <div
                  className={`clean-card h-100 card-interactive card-accent-${card.accent} cursor-pointer ${filter === card.filterKey ? 'ring-active' : ''}`}
                  onClick={() => setFilter(filter === card.filterKey ? "all" : card.filterKey)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body d-flex justify-content-between align-items-center p-3">
                    <div>
                      <div className="small fw-bold text-uppercase mb-1 text-muted" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>{card.label}</div>
                      <div className="fw-bold outfit-font text-dark" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{card.value}</div>
                    </div>
                    <div className={`icon-box-${card.accent} p-3 rounded-4 shadow-sm`}>
                      {card.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger shadow-sm d-flex align-items-center gap-2 rounded-4 border-0">
              <FiAlertCircle size={20} />
              <span>{error}</span>
              <button className="btn btn-sm btn-danger ms-auto rounded-pill" onClick={loadRequests}>Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-2 small">Loading requests...</p>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && (
            <div className="row g-4">
              {/* Requests Table */}
              <div className="col-lg-8">
                <div className="clean-card overflow-hidden">
                  <div className="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center px-4">
                    <h5 className="mb-0 fw-bold outfit-font">
                      <FiFilter className="me-2 text-primary" size={18} style={{ marginTop: -2 }} />
                      {filter === "all" ? "All Requests" : filter === "pending" ? "Pending Requests" : filter === "inProgress" ? "In Progress" : filter === "resolved" ? "Resolved / Approved" : "Rejected Requests"}{" "}
                      <span className="text-muted fw-normal small">({filtered.length})</span>
                    </h5>
                    <button className="btn btn-sm btn-link text-decoration-none fw-bold" onClick={() => navigate("/requests")}>
                      View Full List <FiChevronRight size={14} />
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="ps-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em', width: 90 }}>ID</th>
                          <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Title</th>
                          <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Priority</th>
                          <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Status</th>
                          <th className="text-end pe-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-5 text-muted">
                              <FiFileText size={36} className="mb-2 d-block mx-auto opacity-25" />
                              No requests found for this filter.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((r, index) => (
                            <tr key={r._id} className="row-interactive cursor-pointer" onClick={() => openDetails(r)}>
                              <td className="ps-4">
                                <span className="fw-bold text-primary">{r.requestId ?? (index + 1)}</span>
                              </td>
                              <td>
                                <div className="fw-medium text-dark">{r.title}</div>
                                <div className="small text-muted text-truncate" style={{ maxWidth: 220 }}>{r.description}</div>
                              </td>
                              <td>
                                <span className={`badge ${getPriorityBadge(r.priority)} rounded-pill px-2`}>{r.priority}</span>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadge(r.status)} rounded-pill px-2`}>{r.status || "Pending"}</span>
                              </td>
                              <td className="text-end pe-4">
                                <div className="d-flex gap-2 justify-content-end" onClick={(e) => e.stopPropagation()}>
                                  {r.status === "Pending" && (
                                    <button className="btn btn-sm btn-outline-info rounded-pill px-3 fw-bold" onClick={() => updateStatus(r._id, "In Progress")} disabled={updating === r._id}>
                                      <FiPlay className="me-1" size={13} /> Accept
                                    </button>
                                  )}
                                  {r.status === "In Progress" && (
                                    <button className="btn btn-sm btn-success rounded-pill px-3 fw-bold" onClick={() => updateStatus(r._id, "Resolved")} disabled={updating === r._id}>
                                      <FiCheckCircle className="me-1" size={13} /> Resolve
                                    </button>
                                  )}
                                  {r.status !== "Rejected" && r.status !== "Resolved" && r.status !== "Approved" && (
                                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold" onClick={() => updateStatus(r._id, "Rejected")} disabled={updating === r._id}>
                                      <FiXCircle className="me-1" size={13} /> Reject
                                    </button>
                                  )}
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

              {/* Right Sidebar — Stats + Guide */}
              <div className="col-lg-4">
                {/* Quick Stats */}
                <div className="clean-card mb-4">
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 text-uppercase small text-muted outfit-font" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>
                      <FiTrendingUp className="me-1" /> Performance Breakdown
                    </h6>
                    {[
                      { label: "Pending", count: stats.pending, icon: <FiClock size={18} />, accent: "amber" },
                      { label: "In Progress", count: stats.inProgress, icon: <FiPlay size={18} />, accent: "indigo" },
                      { label: "Resolved", count: stats.resolved, icon: <FiCheckCircle size={18} />, accent: "emerald" },
                      { label: "Rejected", count: stats.rejected, icon: <FiXCircle size={18} />, accent: "rose" },
                    ].map((item) => (
                      <div className="d-flex align-items-center mb-3" key={item.label}>
                        <div className={`icon-box-${item.accent} rounded-3 d-flex align-items-center justify-content-center me-3 p-2`}>
                          {item.icon}
                        </div>
                        <div className="flex-grow-1">
                          <div className="small text-muted">{item.label}</div>
                          <div className="fw-bold text-dark">{item.count}</div>
                        </div>
                        <div style={{ width: 60, height: 6, borderRadius: 3, background: '#eef2f7', overflow: 'hidden' }}>
                          <div style={{
                            width: `${stats.total ? (item.count / stats.total) * 100 : 0}%`,
                            height: '100%',
                            background: `var(--primary-color)`,
                            borderRadius: 3,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Guide */}
                <div className="clean-card card-accent-indigo">
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 outfit-font text-dark d-flex align-items-center gap-2">
                      <span>📋</span> Staff Quick Guide
                    </h6>
                    <ul className="list-unstyled mb-0 small text-muted">
                      <li className="mb-2 d-flex align-items-start">
                        <FiPlay className="me-2 mt-1 flex-shrink-0 text-primary" size={13} />
                        <span>
                          <strong className="text-dark">Accept</strong> pending requests to move them to "In Progress".
                        </span>
                      </li>
                      <li className="mb-2 d-flex align-items-start">
                        <FiCheckCircle className="me-2 mt-1 flex-shrink-0 text-success" size={13} />
                        <span>
                          Once resolved, mark them as <strong className="text-dark">"Resolved"</strong>.
                        </span>
                      </li>
                      <li className="d-flex align-items-start">
                        <FiXCircle className="me-2 mt-1 flex-shrink-0 text-danger" size={13} />
                        <span>
                          Invalid requests can be <strong className="text-dark">rejected</strong>.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetail && activeRequest && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={closeDetails}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 pt-4 px-4 bg-light">
                <div>
                  <h5 className="modal-title fw-bold outfit-font text-dark">{activeRequest.title}</h5>
                  <small className="text-muted">ID: {activeRequest.requestId || activeRequest._id}</small>
                </div>
                <span className={`badge ${getStatusBadge(activeRequest.status)} rounded-pill px-3 py-2 ms-auto me-3`}>
                  {activeRequest.status || "Pending"}
                </span>
                <button type="button" className="btn-close" onClick={closeDetails}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="card border-0 shadow-sm rounded-3 p-3 mb-4">
                  <p className="text-secondary mb-0 fw-medium" style={{ lineHeight: 1.6 }}>{activeRequest.description}</p>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-sm-4">
                    <label className="text-muted d-block text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Priority</label>
                    <span className={`badge px-3 py-2 rounded-pill ${getPriorityBadge(activeRequest.priority)} shadow-sm`}>{activeRequest.priority}</span>
                  </div>
                  <div className="col-sm-4">
                    <label className="text-muted d-block text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Department</label>
                    <span className="fw-bold text-dark">{activeRequest.department || activeRequest.category || 'N/A'}</span>
                  </div>
                  <div className="col-sm-4">
                    <label className="text-muted d-block text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Created On</label>
                    <div className="fw-medium text-dark">{formatDate(activeRequest.createdAt)}</div>
                  </div>
                  <div className="col-sm-4">
                    <label className="text-muted d-block text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Assigned To</label>
                    <div className="fw-bold text-dark">{typeof activeRequest.assignedTo === 'object' ? (activeRequest.assignedTo?.name || 'Not Assigned') : (activeRequest.assignedTo || 'Not Assigned')}</div>
                  </div>
                </div>

                {activeRequest.createdBy && (
                  <div className="d-flex align-items-center gap-2 mb-4 p-3 rounded-3 border bg-white shadow-sm">
                    <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 38, height: 38, fontSize: '14px', fontWeight: 'bold' }}>
                      {typeof activeRequest.createdBy === "object" ? activeRequest.createdBy.name?.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="fw-bold small">{typeof activeRequest.createdBy === "object" ? activeRequest.createdBy.name : "User"}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{typeof activeRequest.createdBy === "object" ? activeRequest.createdBy.email : ""}</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 p-4 bg-white rounded-4 shadow-sm border border-dashed border-primary border-opacity-25">
                  <h6 className="fw-bold mb-3 d-flex align-items-center outfit-font text-primary">
                    <span className="me-2">⚡</span> Quick Actions
                  </h6>
                  <div className="d-flex gap-2">
                    {activeRequest.status === "Pending" && (
                      <button className="btn btn-info fw-bold rounded-3 px-4 text-white shadow-sm" onClick={() => updateStatus(activeRequest._id, "In Progress")} disabled={updating === activeRequest._id}>
                        <FiPlay className="me-1" /> Accept
                      </button>
                    )}
                    {activeRequest.status === "In Progress" && (
                      <button className="btn btn-success fw-bold rounded-3 px-4 shadow-sm" onClick={() => updateStatus(activeRequest._id, "Resolved")} disabled={updating === activeRequest._id}>
                        <FiCheckCircle className="me-1" /> Mark Resolved
                      </button>
                    )}
                    {activeRequest.status !== "Rejected" && activeRequest.status !== "Resolved" && activeRequest.status !== "Approved" && (
                      <button className="btn btn-outline-danger fw-bold rounded-3 px-4" onClick={() => updateStatus(activeRequest._id, "Rejected")} disabled={updating === activeRequest._id}>
                        <FiXCircle className="me-1" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 bg-light">
                <button type="button" className="btn btn-white fw-bold px-4 border rounded-3" onClick={closeDetails}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline CSS for spin animation and active ring */}
      <style>{`
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ring-active { box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15), 0 0 0 1px var(--primary-color) !important; }
      `}</style>
    </div>
  );
}
