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
} from "react-icons/fi";

export default function StaffDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showDetail, setShowDetail] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      // First try assigned requests, then fall back to all requests for staff
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

      // If no assigned requests, fetch all requests (staff can view all)
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

  // Stats
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
  ).slice().sort((a, b) => (a.requestId || 0) - (b.requestId || 0));

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

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h2 className="mb-1 fw-bold text-primary">
            <FiTrendingUp className="me-2" style={{ marginTop: -3 }} />
            Staff Dashboard
          </h2>
          <p className="text-muted small mb-0">Assigned Tasks & Performance Overview</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill border bg-white shadow-sm" style={{ fontSize: '13px' }}>
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

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: <FiFileText size={22} />,
            gradient: "linear-gradient(135deg, #667eea, #764ba2)",
            filterKey: "all",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: <FiClock size={22} />,
            gradient: "linear-gradient(135deg, #f6d365, #fda085)",
            filterKey: "pending",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: <FiPlay size={22} />,
            gradient: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
            filterKey: "inProgress",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: <FiCheckCircle size={22} />,
            gradient: "linear-gradient(135deg, #84fab0, #8fd3f4)",
            filterKey: "resolved",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: <FiXCircle size={22} />,
            gradient: "linear-gradient(135deg, #ff9a9e, #fad0c4)",
            filterKey: "rejected",
          },
        ].map((card) => (
          <div className="col" key={card.label}>
            <div
              className={`card border-0 shadow-sm h-100 card-interactive cursor-pointer ${filter === card.filterKey ? "ring-active" : ""}`}
              onClick={() =>
                setFilter(filter === card.filterKey ? "all" : card.filterKey)
              }
              style={{
                background: card.gradient,
                color: "#fff",
                minWidth: 130,
              }}
            >
              <div className="card-body d-flex justify-content-between align-items-center py-3 px-3">
                <div>
                  <div
                    className="text-uppercase fw-bold mb-1"
                    style={{ fontSize: 10, opacity: 0.85, letterSpacing: 1 }}
                  >
                    {card.label}
                  </div>
                  <div className="fw-bold" style={{ fontSize: 28 }}>
                    {card.value}
                  </div>
                </div>
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(255,255,255,0.25)",
                  }}
                >
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
          <button
            className="btn btn-sm btn-danger ms-auto rounded-pill"
            onClick={loadRequests}
          >
            Retry
          </button>
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
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center px-4">
                <h5 className="mb-0 fw-bold">
                  <FiFilter
                    className="me-2 text-primary"
                    size={18}
                    style={{ marginTop: -2 }}
                  />
                  {filter === "all"
                    ? "All Requests"
                    : filter === "pending"
                      ? "Pending Requests"
                      : filter === "inProgress"
                        ? "In Progress"
                        : filter === "resolved"
                          ? "Resolved / Approved"
                          : "Rejected Requests"}{" "}
                  <span className="text-muted fw-normal small">
                    ({filtered.length})
                  </span>
                </h5>
                <button
                  className="btn btn-sm btn-link text-decoration-none fw-bold"
                  onClick={() => navigate("/requests")}
                >
                  View Full List <FiChevronRight size={14} />
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4" style={{ width: 90 }}>
                        ID
                      </th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-5 text-muted"
                        >
                          <FiFileText
                            size={36}
                            className="mb-2 d-block mx-auto opacity-25"
                          />
                          No requests found for this filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r, index) => (
                        <tr
                          key={r._id}
                          className="row-interactive cursor-pointer"
                          onClick={() => openDetails(r)}
                        >
                          <td className="ps-4">
                            <span className="fw-bold text-primary">
                              {r.requestId ?? (index + 1)}
                            </span>
                          </td>
                          <td>
                            <div className="fw-medium text-dark">{r.title}</div>
                            <div
                              className="small text-muted text-truncate"
                              style={{ maxWidth: 220 }}
                            >
                              {r.description}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${getPriorityBadge(r.priority)} rounded-pill px-2`}
                            >
                              {r.priority}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${getStatusBadge(r.status)} rounded-pill px-2`}
                            >
                              {r.status || "Pending"}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <div
                              className="btn-group shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {r.status === "Pending" && (
                                <button
                                  className="btn btn-sm btn-outline-info rounded-start-pill"
                                  onClick={() =>
                                    updateStatus(r._id, "In Progress")
                                  }
                                  disabled={updating === r._id}
                                  title="Accept"
                                >
                                  <FiPlay className="me-1" size={13} /> Accept
                                </button>
                              )}
                              {r.status === "In Progress" && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() =>
                                    updateStatus(r._id, "Resolved")
                                  }
                                  disabled={updating === r._id}
                                  title="Mark Resolved"
                                >
                                  <FiCheckCircle className="me-1" size={13} />{" "}
                                  Resolve
                                </button>
                              )}
                              {r.status !== "Rejected" &&
                                r.status !== "Resolved" &&
                                r.status !== "Approved" && (
                                  <button
                                    className="btn btn-sm btn-outline-danger rounded-end-pill"
                                    onClick={() =>
                                      updateStatus(r._id, "Rejected")
                                    }
                                    disabled={updating === r._id}
                                    title="Reject"
                                  >
                                    <FiXCircle className="me-1" size={13} />{" "}
                                    Reject
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
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3 text-uppercase small text-muted">
                  <FiTrendingUp className="me-1" /> Overview
                </h6>
                {[
                  {
                    label: "Pending",
                    count: stats.pending,
                    icon: <FiClock size={18} />,
                    color: "#fda085",
                    bg: "rgba(253,160,133,0.12)",
                  },
                  {
                    label: "In Progress",
                    count: stats.inProgress,
                    icon: <FiPlay size={18} />,
                    color: "#667eea",
                    bg: "rgba(102,126,234,0.10)",
                  },
                  {
                    label: "Resolved",
                    count: stats.resolved,
                    icon: <FiCheckCircle size={18} />,
                    color: "#84fab0",
                    bg: "rgba(132,250,176,0.15)",
                  },
                  {
                    label: "Rejected",
                    count: stats.rejected,
                    icon: <FiXCircle size={18} />,
                    color: "#ff9a9e",
                    bg: "rgba(255,154,158,0.12)",
                  },
                ].map((item) => (
                  <div
                    className="d-flex align-items-center mb-3"
                    key={item.label}
                  >
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: 40,
                        height: 40,
                        background: item.bg,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted">{item.label}</div>
                      <div className="fw-bold">{item.count}</div>
                    </div>
                    {/* Mini progress bar */}
                    <div
                      style={{
                        width: 50,
                        height: 6,
                        borderRadius: 3,
                        background: "#eee",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${stats.total ? (item.count / stats.total) * 100 : 0}%`,
                          height: "100%",
                          background: item.color,
                          borderRadius: 3,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Guide */}
            <div
              className="card border-0 rounded-4 text-white shadow-sm"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            >
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">📋 Staff Quick Guide</h6>
                <ul
                  className="list-unstyled mb-0 small"
                  style={{ opacity: 0.9 }}
                >
                  <li className="mb-2 d-flex align-items-start">
                    <FiPlay className="me-2 mt-1 flex-shrink-0" size={13} />
                    <span>
                      <strong>Accept</strong> pending requests to move them to
                      "In Progress".
                    </span>
                  </li>
                  <li className="mb-2 d-flex align-items-start">
                    <FiCheckCircle
                      className="me-2 mt-1 flex-shrink-0"
                      size={13}
                    />
                    <span>
                      Once resolved, mark them as <strong>"Resolved"</strong>.
                    </span>
                  </li>
                  <li className="d-flex align-items-start">
                    <FiXCircle
                      className="me-2 mt-1 flex-shrink-0"
                      size={13}
                    />
                    <span>
                      Invalid requests can be <strong>rejected</strong>.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && activeRequest && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 2000, background: "rgba(0,0,0,0.45)" }}
          onClick={closeDetails}
        >
          <div
            className="card shadow-lg border-0 rounded-4"
            style={{ width: "94%", maxWidth: 700 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="card-header border-0 py-3 px-4 d-flex justify-content-between align-items-center text-white rounded-top-4"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            >
              <div>
                <h5 className="mb-0 fw-bold">{activeRequest.title}</h5>
                <small style={{ opacity: 0.8 }}>
                  ID: {activeRequest.requestId || activeRequest._id}
                </small>
              </div>
              <span
                className={`badge ${getStatusBadge(activeRequest.status)} rounded-pill px-3 py-2`}
              >
                {activeRequest.status || "Pending"}
              </span>
            </div>
            <div className="card-body p-4">
              <p className="bg-light p-3 rounded-3 text-dark mb-4">
                {activeRequest.description}
              </p>

              <div className="row g-3 mb-4">
                <div className="col-sm-4">
                  <small className="text-muted d-block text-uppercase fw-bold mb-1">
                    Department
                  </small>
                  <span className="badge bg-light text-dark border px-3 py-2">
                    {activeRequest.department ||
                      activeRequest.category ||
                      "N/A"}
                  </span>
                </div>
                <div className="col-sm-4">
                  <small className="text-muted d-block text-uppercase fw-bold mb-1">
                    Priority
                  </small>
                  <span
                    className={`badge ${getPriorityBadge(activeRequest.priority)} rounded-pill px-3 py-2`}
                  >
                    {activeRequest.priority}
                  </span>
                </div>
                <div className="col-sm-4">
                  <small className="text-muted d-block text-uppercase fw-bold mb-1">
                    Created
                  </small>
                  <div className="fw-medium small">
                    {formatDate(activeRequest.createdAt)}
                  </div>
                </div>
              </div>

              {/* Created By info */}
              {activeRequest.createdBy && (
                <div className="d-flex align-items-center gap-2 mb-4 p-2 rounded-3 border">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: 32,
                      height: 32,
                      background:
                        "linear-gradient(135deg, #667eea, #764ba2)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {typeof activeRequest.createdBy === "object"
                      ? activeRequest.createdBy.name?.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div>
                    <div className="fw-bold small">
                      {typeof activeRequest.createdBy === "object"
                        ? activeRequest.createdBy.name
                        : "User"}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {typeof activeRequest.createdBy === "object"
                        ? activeRequest.createdBy.email
                        : ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  {activeRequest.status === "Pending" && (
                    <button
                      className="btn btn-info btn-sm rounded-pill px-3 text-white"
                      onClick={() =>
                        updateStatus(activeRequest._id, "In Progress")
                      }
                      disabled={updating === activeRequest._id}
                    >
                      <FiPlay className="me-1" /> Accept
                    </button>
                  )}
                  {activeRequest.status === "In Progress" && (
                    <button
                      className="btn btn-success btn-sm rounded-pill px-3"
                      onClick={() =>
                        updateStatus(activeRequest._id, "Resolved")
                      }
                      disabled={updating === activeRequest._id}
                    >
                      <FiCheckCircle className="me-1" /> Mark Resolved
                    </button>
                  )}
                  {activeRequest.status !== "Rejected" &&
                    activeRequest.status !== "Resolved" &&
                    activeRequest.status !== "Approved" && (
                      <button
                        className="btn btn-outline-danger btn-sm rounded-pill px-3"
                        onClick={() =>
                          updateStatus(activeRequest._id, "Rejected")
                        }
                        disabled={updating === activeRequest._id}
                      >
                        <FiXCircle className="me-1" /> Reject
                      </button>
                    )}
                </div>
                <button
                  className="btn btn-secondary btn-sm rounded-pill px-4"
                  onClick={closeDetails}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline CSS for spin animation and active ring */}
      <style>{`
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ring-active { box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 0 0 5px rgba(102,126,234,0.5) !important; }
      `}</style>
    </div>
  );
}
