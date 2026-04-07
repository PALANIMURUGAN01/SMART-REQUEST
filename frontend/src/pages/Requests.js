import { useEffect, useState, useCallback } from "react";
import { getBadgeClass, getPriorityBadgeClass } from "../utils/statusUtils";
import { FiRefreshCw, FiSearch, FiFilter, FiMaximize2, FiDownload, FiTable, FiGrid } from "react-icons/fi";
import { API_URL } from "../config";

export default function Requests() {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [viewMode, setViewMode] = useState("table");
  const [activeRequest, setActiveRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const statusColors = user?.preferences?.statusColors;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const isStaff = user?.role?.toLowerCase() === 'staff';
      let data = [];
      if (isStaff && user?._id) {
        const assignedRes = await fetch(`${API_URL}/assigned-requests/${user._id}`);
        if (assignedRes.ok) data = await assignedRes.json();
      } else {
        const res = await fetch(`${API_URL}/requests`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        data = await res.json();
      }
      setRequests(data || []);
    } catch (err) {
      setError("Could not load requests. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.role]);

  async function updateStatus(requestId, newStatus) {
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setRequests((prev) => prev.map((r) => (r._id === requestId ? updated : r)));
      if (activeRequest && activeRequest._id === requestId) setActiveRequest(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

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
    if (filterStatus !== "all") filtered = filtered.filter((r) => (r.status || "pending").toLowerCase() === filterStatus.toLowerCase());
    if (filterPriority !== "all") filtered = filtered.filter((r) => (r.priority || "").toLowerCase() === filterPriority.toLowerCase());
    
    if (sortBy === "date") filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else if (sortBy === "id") filtered.sort((a, b) => (b.requestId || 0) - (a.requestId || 0));
    else if (sortBy === "title") filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      filtered.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
    }
    setFilteredRequests(filtered);
  }, [requests, search, filterStatus, filterPriority, sortBy]);

  function openDetails(req) {
    setActiveRequest(req);
    setShowDetail(true);
  }

  function formatDate(t) {
    if (!t) return '---';
    return new Date(t).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5 animate-fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-4">
        <div>
          <h2 className="mb-1 fw-bold text-primary outfit-font">
            {user?.role?.toLowerCase() === 'staff' ? "Task Assignments" : "System-wide Requests"}
          </h2>
          <p className="text-muted small mb-0">Monitor and manage all active service requests across departments</p>
        </div>
        <div className="d-flex gap-2">
            <div className="dropdown">
                <button className="btn btn-white border shadow-sm rounded-3 dropdown-toggle px-3 btn-sm fw-bold" data-bs-toggle="dropdown">
                    <FiDownload className="me-2" /> Export
                </button>
                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg p-2 rounded-3">
                    <li><button className="dropdown-item py-2 fw-medium rounded-2" onClick={() => window.print()}>Print List</button></li>
                </ul>
            </div>
            <div className="btn-group shadow-sm bg-white rounded-3 p-1 border">
                <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${viewMode === 'table' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setViewMode("table")}><FiTable className="me-1" /> Table</button>
                <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${viewMode === 'cards' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setViewMode("cards")}><FiGrid className="me-1" /> Cards</button>
            </div>
        </div>
      </div>

      {/* Advanced Toolbar */}
      <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
        <div className="card-body bg-light p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-0"><FiSearch className="text-muted" /></span>
                <input type="text" className="form-control border-0 py-2 shadow-none" placeholder="Search ID, Title or Department..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2">
               <div className="input-group">
                  <span className="input-group-text bg-white border-0"><FiFilter className="text-muted" size={12} /></span>
                  <select className="form-select border-0 py-2 shadow-none small fw-bold" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Resolved">Resolved</option>
                  </select>
               </div>
            </div>
            <div className="col-md-2">
               <div className="input-group">
                 <span className="input-group-text bg-white border-0"><FiFilter className="text-muted" size={12} /></span>
                 <select className="form-select border-0 py-2 shadow-none small fw-bold" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="id">By ID (New)</option>
                    <option value="date">By Date</option>
                    <option value="title">By Title</option>
                    <option value="priority">By Priority</option>
                 </select>
               </div>
            </div>
            <div className="col-md-2">
              <select className="form-select border-0 py-2 shadow-none small fw-bold" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="all">Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="col-md-2 text-end ms-auto d-flex align-items-center justify-content-end gap-2">
              <button className="btn btn-white shadow-sm border rounded-pill p-2" onClick={loadRequests} title="Refresh Live Data">
                <FiRefreshCw className={loading ? "spin" : ""} size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger rounded-4 border-0 shadow-sm">{error}</div>}

      {/* Table View */}
      {!loading && !error && viewMode === "table" && (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table hover align-middle mb-0">
              <thead>
                <tr className="bg-light border-bottom">
                  <th className="ps-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>ID</th>
                  <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Task Info</th>
                  <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Dept</th>
                  <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Priority</th>
                  <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Status</th>
                  <th className="pe-4 py-3 text-end small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="cursor-pointer" onClick={() => openDetails(req)}>
                    <td className="ps-4 fw-bold text-primary">{req.requestId}</td>
                    <td>
                        <div className="fw-bold text-dark">{req.title}</div>
                        <div className="small text-muted" style={{ fontSize: '11px' }}>Assigned: {req.assignedTo?.name || "Unassigned"}</div>
                    </td>
                    <td><span className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-medium" style={{ fontSize: '11px' }}>{req.department || req.category}</span></td>
                    <td><span className={`badge rounded-pill ${getPriorityBadgeClass(req.priority)} px-3`}>{req.priority}</span></td>
                    <td><span className={`badge rounded-pill ${getBadgeClass(req.status, statusColors)} px-3`}>{req.status || "Pending"}</span></td>
                    <td className="pe-4 text-end">
                       <button className="btn btn-sm btn-white border shadow-sm p-1.5 rounded-circle text-primary" onClick={(e) => { e.stopPropagation(); openDetails(req); }}>
                           <FiMaximize2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && <div className="p-5 text-center text-muted">No requests found. Try adjusting filters.</div>}
          </div>
        </div>
      )}

      {/* Cards View */}
      {!loading && !error && viewMode === "cards" && (
        <div className="row g-4">
          {filteredRequests.map((req) => (
            <div className="col-md-4 col-lg-3" key={req._id}>
              <div className="clean-card h-100 card-interactive shadow-sm p-4 d-flex flex-column" onClick={() => openDetails(req)}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span className="fw-bold text-primary outfit-font h5 mb-0">{req.requestId}</span>
                  <div className="d-flex flex-column gap-1 align-items-end">
                    <span className={`badge ${getBadgeClass(req.status, statusColors)} rounded-pill`} style={{ fontSize: '9px' }}>{req.status}</span>
                    <span className={`badge ${getPriorityBadgeClass(req.priority)} rounded-pill`} style={{ fontSize: '9px' }}>{req.priority}</span>
                  </div>
                </div>
                <h6 className="fw-bold text-dark text-truncate mb-1 outfit-font">{req.title}</h6>
                <div className="text-muted small mb-4 opacity-75">{req.department || req.category}</div>
                
                <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-between">
                   <div className="d-flex align-items-center gap-2">
                       <div className="avatar-xs bg-light rounded-circle text-primary fw-bold text-center" style={{ width: '24px', height: '24px', fontSize: '10px', lineHeight: '24px' }}>
                          {req.assignedTo?.name ? req.assignedTo.name.charAt(0) : "?"}
                       </div>
                       <span className="small text-muted fw-bold" style={{ fontSize: '10px' }}>{req.assignedTo?.name || "UNASSIGNED"}</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {filteredRequests.length === 0 && <div className="text-center py-5 text-muted w-100">No requests found.</div>}
        </div>
      )}

      {showDetail && activeRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowDetail(false)}>
          <div className="card shadow-lg border-0 rounded-4 animate-up" style={{ width: '92%', maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3 className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: '1.4rem', letterSpacing: '0.5px' }}>{activeRequest.title}</h3>
                  <div className="text-muted fw-medium" style={{ fontSize: '14px' }}>ID: {activeRequest.requestId || activeRequest._id}</div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  <span className={`badge rounded-pill ${getBadgeClass(activeRequest.status, statusColors)} px-4 py-2`} style={{ fontSize: '12px' }}>
                    {activeRequest.status || 'Pending'}
                  </span>
                  <span className={`badge rounded-pill ${getPriorityBadgeClass(activeRequest.priority)} px-4 py-2`} style={{ fontSize: '12px' }}>
                    {activeRequest.priority || 'Medium'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-dark fw-medium opacity-75 text-uppercase" style={{ fontSize: '15px', lineHeight: 1.6 }}>{activeRequest.description}</p>
              </div>

              <div className="row g-4 mb-5 border-top pt-4">
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-2" style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>Category</div>
                  <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>{activeRequest.department || activeRequest.category || 'General'}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-2" style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>Timeline</div>
                  <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                    Created: {formatDate(activeRequest.createdAt)}<br/>
                    {activeRequest.status === 'Approved' && <>Approved: {formatDate(activeRequest.approvedAt)}</>}
                    {activeRequest.status === 'Resolved' && <>Resolved: {formatDate(activeRequest.resolvedAt)}</>}
                    {activeRequest.status === 'Rejected' && <>Rejected: {formatDate(activeRequest.rejectedAt)}</>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-2" style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>Assigned To</div>
                  <div className="fw-bold text-dark text-uppercase" style={{ fontSize: '14px' }}>
                    {activeRequest.assignedTo?.name || activeRequest.assignedTo || 'Unassigned'}
                  </div>
                </div>
              </div>

              {activeRequest.status === "Rejected" && activeRequest.rejectionReason && (
                <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3">
                  <div className="text-danger small fw-bold text-uppercase mb-1" style={{ fontSize: '11px' }}>Rejection Reason</div>
                  <p className="mb-0 text-dark small fw-medium">{activeRequest.rejectionReason}</p>
                </div>
              )}

              {activeRequest.status === "Resolved" && activeRequest.resolutionMessage && (
                <div className="mb-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3">
                  <div className="text-success small fw-bold text-uppercase mb-1" style={{ fontSize: '11px' }}>Resolution Details</div>
                  <p className="mb-0 text-dark small fw-medium">{activeRequest.resolutionMessage}</p>
                </div>
              )}

              <div className="d-flex gap-2">
                {(user?.role?.toLowerCase() === 'staff' || user?.role?.toLowerCase() === 'admin') && activeRequest.status === "Pending" && (
                  <>
                    <button className="btn btn-success py-2 px-4 shadow-sm fw-bold border-0" onClick={() => { updateStatus(activeRequest._id, "Approved"); setShowDetail(false); }}>Approve</button>
                    <button className="btn btn-danger py-2 px-4 shadow-sm fw-bold border-0" onClick={() => { updateStatus(activeRequest._id, "Rejected"); setShowDetail(false); }}>Reject</button>
                  </>
                )}
                <button className="btn px-5 py-2.5 fw-bold text-white rounded-3 shadow-sm border-0 ms-auto" 
                        style={{ backgroundColor: '#5c6c7c', fontSize: '15px' }} 
                        onClick={() => setShowDetail(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
