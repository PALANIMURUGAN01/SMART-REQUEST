import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiCheckCircle, FiClock, FiXCircle, FiTrendingUp, FiPlus, FiArrowRight, FiInfo } from "react-icons/fi";
import { getBadgeClass, getPriorityBadgeClass } from "../utils/statusUtils";
import { API_URL } from "../config";

export default function Dashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const statusColors = user?.preferences?.statusColors;

  useEffect(() => {
    if (!user?._id) { navigate("/"); return; }
    fetchData(user._id);
  }, [navigate, user?._id]);

  async function fetchData(userId) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user-requests/${userId}`);
      if (!res.ok) throw new Error(`Connectivity Error (${res.status})`);
      const data = await res.json();
      setRequests(data.requests || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openDetails(req) { setActiveRequest(req); setShowDetail(true); }
  function closeDetails() { setActiveRequest(null); setShowDetail(false); }

  function formatDate(t) {
    if (!t) return '---';
    return new Date(t).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4 border-0 shadow-sm rounded-4">{error}</div>;

  return (
    <div className="container-fluid py-4 px-lg-5 animate-fade-in">
      {/* Personalized Welcome */}
      <div className="row mb-5 align-items-center">
        <div className="col-12 col-md-8">
          <h1 className="fw-bold text-dark outfit-font mb-1" style={{ fontSize: '2.2rem' }}>Welcome back, <span className="text-primary">{user.name?.split(' ')[0] || 'User'}!</span></h1>
          <p className="text-muted fw-medium">Your system activity and request lifecycle at a glance.</p>
        </div>
        <div className="col-12 col-md-4 text-md-end mt-3 mt-md-0">
          <button className="btn btn-primary shadow-lg grad-indigo border-0 rounded-3 px-4 py-2.5 fw-bold d-flex align-items-center gap-2 ms-md-auto" onClick={() => navigate("/create")}>
            <FiPlus size={18} /> New Request
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="row g-4 mb-5">
        {[
          { label: "Total History", val: stats.total, color: "indigo", icon: <FiFileText /> },
          { label: "Pending", val: stats.pending, color: "amber", icon: <FiClock /> },
          { label: "Resolved", val: stats.approved, color: "emerald", icon: <FiCheckCircle /> },
          { label: "Rejected", val: stats.rejected, color: "rose", icon: <FiXCircle /> }
        ].map(k => (
          <div key={k.label} className="col-sm-6 col-md-3">
            <div className={`clean-card card-interactive card-accent-${k.color} p-4 h-100`}>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>{k.label}</div>
                  <div className="h2 fw-bold text-dark outfit-font mb-0">{k.val}</div>
                </div>
                <div className={`icon-box-${k.color} p-2.5 rounded-3 shadow-sm bg-white border border-${k.color} border-opacity-10 text-${k.color}`}>
                  {k.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Recent Activity Table - Full Width Optimization */}
        <div className="col-lg-12">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white py-4 px-4 border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold outfit-font d-flex align-items-center gap-2"><FiTrendingUp className="text-primary" /> Recent Activity</h5>
              <button className="btn btn-link text-primary fw-bold text-decoration-none small p-0 d-flex align-items-center gap-1" onClick={() => navigate("/requests")}>View All Records <FiArrowRight /></button>
            </div>
            <div className="table-responsive">
              <table className="table hover align-middle mb-0">
                <thead className="bg-light">
                  <tr style={{ fontSize: '12px' }}>
                    <th className="ps-4 py-3 text-muted fw-bold text-uppercase">ID</th>
                    <th className="py-3 text-muted fw-bold text-uppercase">Request Details</th>
                    <th className="py-3 text-muted fw-bold text-uppercase text-center">Status</th>
                    <th className="pe-4 py-3 text-muted fw-bold text-uppercase text-end">Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan="4" className="py-5 text-center text-muted">No activities recorded yet.</td></tr>
                  ) : (
                    [...requests].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 8).map((req) => (
                      <tr key={req._id} className="cursor-pointer" onClick={() => openDetails(req)}>
                        <td className="ps-4 fw-bold text-primary">{req.requestId}</td>
                        <td>
                          <div className="fw-bold text-dark">{req.title}</div>
                          <div className="text-muted small" style={{ fontSize: '11px' }}>Dept: {req.department || req.category}</div>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill px-3 py-1.5 ${getBadgeClass(req.status, statusColors)}`}>{req.status}</span>
                        </td>
                        <td className="pe-4 text-end text-muted small">{formatDate(req.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && activeRequest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.4)' }} onClick={closeDetails}>
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

              <p className="text-dark fw-medium p-3 bg-light rounded-3 mb-5 border-start border-primary border-4">{activeRequest.description}</p>

              <div className="row g-4 mb-5 border-top pt-4">
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '11px' }}>Timeline</div>
                  <div className="fw-bold text-dark small">{formatDate(activeRequest.createdAt)}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '11px' }}>Category</div>
                  <div className="fw-bold text-dark small">{activeRequest.department || activeRequest.category}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted text-uppercase mb-1 fw-bold" style={{ fontSize: '11px' }}>Assigned Specialist</div>
                  <div className="fw-bold text-dark text-uppercase small">{activeRequest.assignedTo?.name || 'Pending'}</div>
                </div>
              </div>

              {activeRequest.status === "Rejected" && activeRequest.rejectionReason && (
                <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 text-danger">
                  <div className="small fw-bold text-uppercase mb-1">Rejection Remarks</div>
                  <p className="mb-0 text-dark small fw-medium">{activeRequest.rejectionReason}</p>
                </div>
              )}

              {activeRequest.status === "Resolved" && activeRequest.resolutionMessage && (
                <div className="mb-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 text-success">
                  <div className="small fw-bold text-uppercase mb-1">Resolution Summary</div>
                  <p className="mb-0 text-dark small fw-medium">{activeRequest.resolutionMessage}</p>
                </div>
              )}

              <div className="d-flex justify-content-end">
                <button className="btn px-5 py-2.5 fw-bold text-white rounded-3 shadow border-0" style={{ backgroundColor: '#5c6c7c' }} onClick={closeDetails}>Close Overview</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
