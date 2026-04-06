import { useEffect, useState } from "react";
import { getBadgeClass, getPriorityBadgeClass } from "../utils/statusUtils";
import { FiEye, FiEdit3, FiTrash2, FiSearch, FiRefreshCw, FiGrid, FiList } from "react-icons/fi";

export default function Requests() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [viewMode, setViewMode] = useState("table");
  const [activeRequest, setActiveRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const statusColors = user.preferences?.statusColors;

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const isStaff = user.role?.toLowerCase() === 'staff';
      let data = [];

      if (isStaff && user._id) {
        // Try assigned requests first
        try {
          const assignedRes = await fetch(`http://localhost:5000/assigned-requests/${user._id}`);
          if (assignedRes.ok) {
            data = await assignedRes.json();
          }
        } catch {
          // ignore, will fallback
        }
        // Fallback: if no assigned requests, show all requests
        if (!data || data.length === 0) {
          const allRes = await fetch("http://localhost:5000/requests");
          if (allRes.ok) {
            data = await allRes.json();
          }
        }
      } else {
        // Admin or other roles: fetch all
        const res = await fetch("http://localhost:5000/requests");
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        data = await res.json();
      }

      setRequests(data || []);
    } catch (err) {
      console.error(err);
      setError("Could not load requests. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let filtered = [...requests];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.requestId?.toString().includes(q)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => (r.status || "pending").toLowerCase() === filterStatus.toLowerCase());
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((r) => (r.category || "").toLowerCase() === filterCategory.toLowerCase());
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter((r) => (r.priority || "").toLowerCase() === filterPriority.toLowerCase());
    }

    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "id") {
      filtered.sort((a, b) => (b.requestId || 0) - (a.requestId || 0));
    } else if (sortBy === "title") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      filtered.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
    }

    setFilteredRequests(filtered);
  }, [requests, search, filterStatus, filterCategory, filterPriority, sortBy]);

  function openDetails(req) {
    setActiveRequest(req);
    setShowDetail(true);
  }

  function formatDate(t) {
    if (!t) return 'N/A';
    return new Date(t).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h2 className="mb-1 fw-bold text-primary">
            {user.role?.toLowerCase() === 'staff' ? "Assigned Requests" : "System Requests"}
          </h2>
          <p className="text-muted small mb-0">
            {user.role?.toLowerCase() === 'staff'
              ? "View and manage tasks specifically assigned to your account"
              : "Monitor and manage all system requests across all categories"}
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {user.role?.toLowerCase() === 'staff' && (
            <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">{requests.length} Assigned</span>
          )}
          <div className="btn-group shadow-sm bg-white rounded-3 p-1 border">
            <button
              className={`btn btn-sm px-3 rounded-2 border-0 ${viewMode === 'table' ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
              onClick={() => setViewMode("table")}
            >
              <FiList size={14} className="me-1" /> Table
            </button>
            <button
              className={`btn btn-sm px-3 rounded-2 border-0 ${viewMode === 'cards' ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
              onClick={() => setViewMode("cards")}
            >
              <FiGrid size={14} className="me-1" /> Cards
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4 overflow-hidden">
        <div className="card-body bg-light p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><FiSearch className="text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search ID, title, or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="id">Sort by ID</option>
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>

            <div className="col-md-6">
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  className="form-select form-select-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">Department: All</option>
                  <option value="institute">Institute</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="network">Network</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <select
                  className="form-select form-select-sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">Priority: All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                  onClick={() => loadRequests()}
                  title="Refresh Data"
                >
                  <FiRefreshCw size={14} className={loading ? "spin" : ""} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="card-footer bg-white py-2 d-flex justify-content-between align-items-center border-0">
          <span className="text-muted small">Showing {filteredRequests.length} results</span>
          {(search || filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all') && (
            <button className="btn btn-link btn-sm text-decoration-none p-0" onClick={() => { setSearch(''); setFilterStatus('all'); setFilterCategory('all'); setFilterPriority('all'); }}>Clear Filters</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm">{error}</div>}

      {!loading && !error && viewMode === "table" && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">ID</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th className="text-end pe-4">Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No matching requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id || req.id}>
                      <td className="ps-4 fw-bold text-primary">{req.requestId}</td>
                      <td>
                        <div className="fw-medium">{req.title}</div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{req.description}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{req.department || req.category}</span>
                      </td>
                      <td className="text-muted small">
                        {formatDate(req.createdAt)}
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <span className={`badge ${getBadgeClass(req.status, statusColors)}`}>
                          {req.status || "Pending"}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openDetails(req)}
                            title="View Details"
                          >
                            <FiEye className="me-1" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && viewMode === "cards" && (
        <div className="row g-4">
          {filteredRequests.length === 0 ? (
            <div className="col-12 text-center py-5">
              <div className="text-muted">No matching requests found</div>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div key={req._id || req.id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="badge bg-primary bg-opacity-10 text-primary border-0 rounded-pill px-3">{req.requestId}</span>
                      <span className={`badge ${getBadgeClass(req.status, statusColors)} rounded-pill px-3`}>
                        {req.status || "Pending"}
                      </span>
                    </div>
                    <h5 className="card-title fw-bold mb-2">{req.title}</h5>
                    <p className="card-text text-muted small mb-4 text-truncate-2" style={{ height: '40px' }}>{req.description}</p>

                    <div className="d-flex align-items-center gap-2 mb-4">
                      <span className="badge bg-light text-dark border-0">{req.department || req.category}</span>
                      <span className={`badge ${getPriorityBadgeClass(req.priority)} border-0`}>{req.priority}</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                      <span className="text-muted small">{formatDate(req.createdAt)}</span>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openDetails(req)} title="View">
                          <FiEye className="me-1" /> View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetail && activeRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowDetail(false)}>
          <div className="card shadow-lg" style={{ width: '92%', maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1 fw-bold text-primary">{activeRequest.title}</h5>
                  <small className="text-muted">ID: {activeRequest.requestId || activeRequest._id}</small>
                </div>
                <div className="text-end">
                  <div><span className={`badge rounded-pill ${getBadgeClass(activeRequest.status, statusColors)} px-3`}>{activeRequest.status || 'Pending'}</span></div>
                  <div className="mt-2 text-muted small">{activeRequest.priority} Priority</div>
                </div>
              </div>

              <div className="bg-light p-3 rounded mb-4" style={{ minHeight: '100px' }}>
                <p className="mb-0">{activeRequest.description}</p>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <small className="text-muted d-block text-uppercase small fw-bold">Department</small>
                  <div className="fw-medium">{activeRequest.department || activeRequest.category || 'N/A'}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block text-uppercase small fw-bold">Created Time</small>
                  <div className="fw-medium">{formatDate(activeRequest.createdAt)}</div>
                </div>
                {activeRequest.status === 'Approved' && activeRequest.approvedAt && (
                  <div className="col-md-4">
                    <small className="text-muted d-block text-uppercase small fw-bold">Approved Time</small>
                    <div className="fw-medium text-success">{formatDate(activeRequest.approvedAt)}</div>
                  </div>
                )}
                {activeRequest.status === 'Rejected' && activeRequest.rejectedAt && (
                  <div className="col-md-4">
                    <small className="text-muted d-block text-uppercase small fw-bold">Rejected Time</small>
                  </div>
                )}
                <div className="col-md-4">
                  <small className="text-muted d-block text-uppercase small fw-bold">Assigned To</small>
                  <div className="fw-medium">{typeof activeRequest.assignedTo === 'object' ? (activeRequest.assignedTo?.name || 'Not Assigned') : (activeRequest.assignedTo || 'Not Assigned')}</div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary px-4" onClick={() => setShowDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
