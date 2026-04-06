import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { getBadgeClass } from "../utils/statusUtils";

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const statusColors = user.preferences?.statusColors;

  useEffect(() => {
    // 1. Check user session
    if (!user || !user._id) {
      navigate("/");
      return;
    }

    // 2. Fetch user-specific data
    fetchData(user._id);
  }, [navigate, user._id]);

  async function fetchData(userId) {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/user-requests/${userId}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Dashboard fetch error body:", text);
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || "Failed to load dashboard data");
        } catch (e) {
          throw new Error(`Server Error (${res.status}): ${text.substring(0, 50)}...`);
        }
      }

      const data = await res.json();
      setRequests(data.requests || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    if (!t) return 'N/A';
    return new Date(t).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <div className="container-fluid py-3 px-4 animate-up">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 className="mb-0 fw-bold text-dark outfit-font" style={{ fontSize: '1.5rem' }}>My Dashboard</h1>
          <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Overview of your activity & status</p>
        </div>
        {user.role?.toLowerCase() === 'user' && (
          <button className="btn btn-primary shadow-sm rounded-pill px-4 fw-bold" onClick={() => navigate("/create")}>
            + New Request
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="clean-card h-100 card-interactive card-accent-indigo">
            <div className="card-body d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="small fw-bold text-uppercase mb-1 text-muted" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>Total Requests</div>
                <div className="fw-bold outfit-font text-dark" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{stats.total}</div>
              </div>
              <div className="icon-box-indigo p-3 rounded-4 shadow-sm">
                <FiFileText size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="clean-card h-100 card-interactive card-accent-amber">
            <div className="card-body d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="small fw-bold text-uppercase mb-1 text-muted" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>Pending</div>
                <div className="fw-bold outfit-font text-dark" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{stats.pending}</div>
              </div>
              <div className="icon-box-amber p-3 rounded-4 shadow-sm">
                <FiClock size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="clean-card h-100 card-interactive card-accent-emerald">
            <div className="card-body d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="small fw-bold text-uppercase mb-1 text-muted" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>Approved</div>
                <div className="fw-bold outfit-font text-dark" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{stats.approved}</div>
              </div>
              <div className="icon-box-emerald p-3 rounded-4 shadow-sm">
                <FiCheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="clean-card h-100 card-interactive card-accent-rose">
            <div className="card-body d-flex justify-content-between align-items-center p-3">
              <div>
                <div className="small fw-bold text-uppercase mb-1 text-muted" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>Rejected</div>
                <div className="fw-bold outfit-font text-dark" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{stats.rejected}</div>
              </div>
              <div className="icon-box-rose p-3 rounded-4 shadow-sm">
                <FiXCircle size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {user.role?.toLowerCase() === 'admin' ? (
        <div className="card shadow-sm border-0 bg-light p-5 text-center">
          <h4 className="fw-bold text-muted">Admin View</h4>
          <p>Please use the Admin Panel to manage system requests and users.</p>
          <button className="btn btn-primary px-4 mt-3" onClick={() => navigate("/admin")}>Go to Admin Panel</button>
        </div>
      ) : (
        <div className="clean-card overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom-0">
            <h5 className="mb-0 fw-bold text-dark outfit-font">Recent Requests</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th scope="col" className="ps-4 py-3 small fw-bold text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>ID</th>
                  <th scope="col" className="py-3 small fw-bold text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Title</th>
                  <th scope="col" className="py-3 small fw-bold text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Department</th>
                  <th scope="col" className="py-3 small fw-bold text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Submitted</th>
                  <th scope="col" className="py-3 small fw-bold text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Status</th>
                  <th scope="col" className="text-end pe-4 py-3 small fw-bold text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No requests found. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  [...requests].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 5).map((req) => (
                    <tr key={req._id} className="row-interactive cursor-pointer" onClick={() => openDetails(req)}>
                      <td className="ps-4">
                        <span className="fw-bold text-primary">{req.requestId}</span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{req.title}</div>
                        <div className="small text-muted d-md-none">{formatDate(req.createdAt)}</div>
                      </td>
                      <td>
                        <span className="px-3 py-1 bg-light text-dark rounded-pill border small fw-medium">
                          {req.department || req.category}
                        </span>
                      </td>
                      <td className="text-muted small">{formatDate(req.createdAt)}</td>
                      <td>
                        <span className={`badge ${getBadgeClass(req.status, statusColors)} rounded-pill px-3 py-1.5`} style={{ fontSize: '0.75rem' }}>
                          {req.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-light border fw-bold text-primary px-3 rounded-pill" onClick={() => openDetails(req)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
                  <h5 className="mb-1 fw-bold">{activeRequest.title}</h5>
                  <small className="text-muted">ID: {activeRequest.requestId || activeRequest._id}</small>
                </div>
                <div className="text-end">
                  <div><span className={`badge rounded-pill ${getBadgeClass(activeRequest.status, statusColors)} px-3`}>{activeRequest.status || 'Pending'}</span></div>
                  <div className="mt-2 text-muted small">{activeRequest.priority} Priority</div>
                </div>
              </div>

              <p className="text-dark bg-light p-3 rounded">{activeRequest.description}</p>

              <div className="row g-2 mb-3">
                <div className="col-sm-4">
                  <small className="text-muted d-block text-uppercase small fw-bold">Department</small>
                  <div className="fw-medium">{activeRequest.department || activeRequest.category || 'N/A'}</div>
                </div>
                <div className="col-sm-4">
                  <small className="text-muted d-block text-uppercase small fw-bold">Created Time</small>
                  <div className="fw-medium">{formatDate(activeRequest.createdAt)}</div>
                </div>
                {activeRequest.status === 'Approved' && activeRequest.approvedAt && (
                  <div className="col-sm-4">
                    <small className="text-muted d-block text-uppercase small fw-bold">Approved Time</small>
                    <div className="fw-medium text-success">{formatDate(activeRequest.approvedAt)}</div>
                  </div>
                )}
                {activeRequest.status === 'Rejected' && activeRequest.rejectedAt && (
                  <div className="col-sm-4">
                    <small className="text-muted d-block text-uppercase small fw-bold">Rejected Time</small>
                    <div className="fw-medium text-danger">{formatDate(activeRequest.rejectedAt)}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 d-flex justify-content-end">
                <button className="btn btn-secondary px-4" onClick={closeDetails}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
