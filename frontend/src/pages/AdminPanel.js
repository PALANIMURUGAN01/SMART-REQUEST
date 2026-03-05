import { useEffect, useState } from "react";
import { getBadgeClass } from "../utils/statusUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FiFileText, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function AdminPanel() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [view, setView] = useState("overview");
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority] = useState("all");
  const [active, setActive] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userModalType, setUserModalType] = useState("add"); // "add" or "edit"
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("staff");
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    phone: "",
    permissions: { canView: true, canEdit: true }
  });

  const statusColors = currentUser.preferences?.statusColors;

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/requests");
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError("Could not load requests. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/users");
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(); // Load users on mount to have them available for assignment
  }, []);

  useEffect(() => {
    if (view === "requests" || view === "overview") loadRequests();
    if (view === "users") loadUsers();
  }, [view]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => (r.status || 'Pending').toLowerCase() === 'pending').length,
    approved: requests.filter(r => (r.status || '').toLowerCase() === 'approved' || (r.status || '').toLowerCase() === 'resolved').length,
    rejected: requests.filter(r => (r.status || '').toLowerCase() === 'rejected').length,
  };

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

  const filteredRequests = requests.filter((r) => {
    if (search && !(r.title || "").toLowerCase().includes(search.toLowerCase()) && !(r.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && ((r.status || "pending").toLowerCase() !== filterStatus.toLowerCase())) return false;
    if (filterPriority !== "all" && ((r.priority || "low").toLowerCase() !== filterPriority.toLowerCase())) return false;
    return true;
  });

  function handleExportPDF() {
    const filteredUsers = users.filter(u => u.role === userRoleFilter &&
      ((u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase()))
    );

    if (filteredUsers.length === 0) {
      alert("No users to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${userRoleFilter.toUpperCase()} Directory`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const headers = ["Name", "Email", "Department", "Phone"];
    const rows = filteredUsers.map(u => [
      u.name || "",
      u.email || "",
      u.department || "General",
      u.phone || "---"
    ]);

    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`users_${userRoleFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  function handleExportRequestsPDF() {
    if (filteredRequests.length === 0) {
      alert("No requests to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("System Requests Directory", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Filter status: ${filterStatus.toUpperCase()}`, 14, 36);

    const headers = ["ID", "Title", "Category", "Status", "Date"];
    const rows = filteredRequests.map(r => [
      r.requestId || "-",
      r.title || "",
      r.category || r.department || "General",
      r.status || "Pending",
      formatDate(r.createdAt)
    ]);

    autoTable(doc, {
      startY: 42,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] }
    });

    doc.save(`requests_export_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  async function handleResetRequests() {
    if (!window.confirm("CRITICAL ACTION: Are you sure you want to delete ALL requests? This will reset the ID counter to 1. This action cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/requests", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset requests.");
      const data = await res.json();
      alert(data.message);
      setRequests([]);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function patchRequest(id, patch) {
    try {
      const res = await fetch(`http://localhost:5000/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const updated = await res.json();
      setRequests(prev => prev.map(r => r._id === id ? updated : r));
      return updated;
    } catch (err) {
      console.error("patchRequest failed:", err);
      return null;
    }
  }

  async function handleAddOrUpdateUser(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editUser ? "PATCH" : "POST";
      const url = editUser ? `http://localhost:5000/users/${editUser._id}` : "http://localhost:5000/users";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save user");
      }
      loadUsers();
      setShowUserModal(false);
      setEditUser(null);
      setUserForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        department: "",
        phone: "",
        permissions: { canView: true, canEdit: true }
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h1 className="mb-0 fw-bold text-dark outfit-font" style={{ fontSize: '1.8rem' }}>Admin Dashboard</h1>
          <p className="text-muted small mb-0">System Control & User Management</p>
        </div>
        <div className="btn-group shadow-sm bg-white rounded-3 p-1 border">
          <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${view === 'overview' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setView('overview')}>Overview</button>
          <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${view === 'requests' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setView('requests')}>Requests</button>
          <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${view === 'users' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setView('users')}>Users</button>
        </div>
      </div>

      {loading && <div className="text-center py-5 mt-5"><div className="spinner-border text-primary"></div></div>}
      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      {!loading && !error && (
        <>
          {view === "overview" && (
            <div className="animate-fade-in">
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

              <div className="clean-card overflow-hidden">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom-0">
                  <h5 className="mb-0 fw-bold outfit-font">Recent System Activity</h5>
                  <button className="btn btn-sm btn-link text-decoration-none fw-bold" onClick={() => setView('requests')}>View All</button>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4 py-2 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>ID</th>
                        <th className="py-2 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Title</th>
                        <th className="py-2 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Category</th>
                        <th className="py-2 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Date</th>
                        <th className="text-end pe-4 py-2 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-4 text-muted">No activity found</td></tr>
                      ) : (
                        [...requests].slice(-5).map((r) => (
                          <tr key={r._id}>
                            <td className="ps-4 fw-bold text-primary">{r.requestId}</td>
                            <td>{r.title}</td>
                            <td>{r.category || r.department || "-"}</td>
                            <td className="text-muted small">{formatDate(r.createdAt)}</td>
                            <td className="text-end pe-4">
                              <span className={`badge ${getBadgeClass(r.status, statusColors)}`}>
                                {r.status || 'Pending'}
                              </span>
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

          {view === "requests" && (
            <div className="animate-fade-in">
              <div className="row g-2 mb-3">
                <div className="col-md-5">
                  <input className="form-control" placeholder="Search title or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    {['Pending', 'In Progress', 'Approved', 'Rejected'].map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                  </select>
                </div>
                <div className="col-md-4 text-end d-flex gap-2 justify-content-end">
                  <button className="btn btn-outline-danger fw-bold" onClick={handleResetRequests}>Clear All</button>
                  <button className="btn btn-outline-primary fw-bold" onClick={handleExportRequestsPDF}>Export PDF</button>
                </div>
              </div>
              <div className="clean-card overflow-hidden">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>ID</th>
                        <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Title</th>
                        <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Category</th>
                        <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Requested By</th>
                        <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Date</th>
                        <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Status</th>
                        <th className="pe-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((r) => (
                        <tr key={r._id}>
                          <td className="fw-bold text-primary">{r.requestId}</td>
                          <td>{r.title}</td>
                          <td>{r.category || r.department || "-"}</td>
                          <td className="text-muted small">
                            {r.createdBy?.name || r.createdBy?.email || r.ownerEmail || "System"}
                          </td>
                          <td className="text-muted small">{formatDate(r.createdAt)}</td>
                          <td>
                            <span className={`badge ${getBadgeClass(r.status, statusColors)}`}>
                              {r.status || 'Pending'}
                            </span>
                          </td>
                          <td className="pe-4">
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-light fw-bold px-3 border" onClick={() => setActive(r)}>View</button>
                              <button className="btn btn-sm btn-success fw-bold px-3 shadow-sm" onClick={() => patchRequest(r._id, { status: "Approved" })}>Approve</button>
                              <button className="btn btn-sm btn-danger fw-bold px-3 shadow-sm" onClick={() => patchRequest(r._id, { status: "Rejected" })}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === "users" && (
            <div className="animate-fade-in">
              <div className="card shadow-sm border-0 mb-4 p-3 bg-white rounded-4 border">
                <div className="row g-3 align-items-center">
                  <div className="col-md-4">
                    <h5 className="fw-bold mb-0 outfit-font">User Management</h5>
                    <p className="text-muted small mb-0">Manage roles and permissions for {users.length} members</p>
                  </div>
                  <div className="col-md-3">
                    <div className="input-group input-group-sm rounded-3 overflow-hidden border">
                      <span className="input-group-text bg-light border-0">Search</span>
                      <input
                        type="text"
                        className="form-control bg-light border-0"
                        placeholder="Name, email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="btn-group btn-group-sm w-100 shadow-sm border rounded-3 overflow-hidden p-1 bg-light">
                      <button className={`btn btn-sm border-0 rounded-2 fw-bold ${userRoleFilter === 'admin' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setUserRoleFilter('admin')}>Admins</button>
                      <button className={`btn btn-sm border-0 rounded-2 fw-bold ${userRoleFilter === 'staff' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setUserRoleFilter('staff')}>Staff</button>
                      <button className={`btn btn-sm border-0 rounded-2 fw-bold ${userRoleFilter === 'user' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setUserRoleFilter('user')}>Users</button>
                    </div>
                  </div>
                  <div className="col-md-2 text-end d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary fw-bold rounded-3 shadow-sm" onClick={handleExportPDF}>
                      Export
                    </button>
                    <button className="btn btn-sm grad-indigo fw-bold rounded-3 shadow-sm" onClick={() => {
                      setEditUser(null);
                      setUserForm({
                        name: "", email: "", password: "", role: "user", department: "", phone: "",
                        permissions: { canView: true, canEdit: true }
                      });
                      setShowUserModal(true);
                    }}>
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 rounded-4 overflow-hidden border">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>User Details</th>
                        <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Department</th>
                        <th className="py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Contact</th>
                        <th className="text-end pe-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => u.role === userRoleFilter)
                        .filter(u =>
                          (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map((u) => (
                          <tr key={u._id} className="user-row-hover">
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div className="avatar-placeholder me-3 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', fontSize: '14px', fontWeight: 'bold' }}>
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-bold text-dark">{u.name}</div>
                                  <div className="text-muted small">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="fw-medium">{u.department || "No Department"}</div>
                            </td>
                            <td>
                              <div className="small font-monospace text-muted">{u.phone || "---"}</div>
                            </td>
                            <td className="text-end pe-4">
                              <div className="d-flex gap-2 justify-content-end">
                                <button className="btn btn-sm btn-light fw-bold px-3 border" onClick={() => {
                                  setEditUser(u);
                                  setUserForm({
                                    ...u,
                                    password: "",
                                    permissions: u.permissions || { canView: true, canEdit: true }
                                  });
                                  setShowUserModal(true);
                                }}>Edit</button>
                                <button className="btn btn-sm btn-outline-danger fw-bold px-3" onClick={() => handleDeleteUser(u._id)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showUserModal && (
        <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 pt-4 px-4 bg-light">
                <h5 className="modal-title fw-bold outfit-font text-dark">{editUser ? 'Edit User/Faculty' : 'Add New Member'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
              </div>
              <form onSubmit={handleAddOrUpdateUser}>
                <div className="modal-body p-4 bg-light">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Full Name</label>
                    <input type="text" className="form-control border-0 shadow-sm rounded-3" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Email Address</label>
                    <input type="email" className="form-control border-0 shadow-sm rounded-3" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                  </div>
                  {!editUser && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Password</label>
                      <input type="password" placeholder="Min 4 characters" className="form-control border-0 shadow-sm rounded-3" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Role</label>
                      <select className="form-select border-0 shadow-sm rounded-3" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                        <option value="user">User (Requester)</option>
                        <option value="staff">Staff (Faculty)</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Department</label>
                      <input type="text" className="form-control border-0 shadow-sm rounded-3" placeholder="e.g. IT, HR" value={userForm.department} onChange={e => setUserForm({ ...userForm, department: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Phone Number</label>
                    <input type="text" className="form-control border-0 shadow-sm rounded-3" placeholder="+91 ..." value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
                  </div>
                  <div className="p-3 bg-white bg-opacity-50 rounded-3 border border-dashed mb-0">
                    <label className="form-label small fw-bold text-muted d-block mb-2 text-uppercase" style={{ fontSize: '11px' }}>Access Control</label>
                    <div className="d-flex gap-4">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={userForm.permissions?.canView} onChange={e => setUserForm({ ...userForm, permissions: { ...userForm.permissions, canView: e.target.checked } })} />
                        <label className="form-check-label small fw-medium">Can View</label>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={userForm.permissions?.canEdit} onChange={e => setUserForm({ ...userForm, permissions: { ...userForm.permissions, canEdit: e.target.checked } })} />
                        <label className="form-check-label small fw-medium">Can Edit</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 bg-light">
                  <button type="button" className="btn btn-link text-muted fw-bold text-decoration-none" onClick={() => setShowUserModal(false)}>Cancel</button>
                  <button type="submit" className="btn grad-indigo fw-bold px-4 rounded-3 shadow" disabled={saving}>{saving ? 'Saving...' : (editUser ? 'Update Member' : 'Create Member')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {active && (
        <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setActive(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 pt-4 px-4 bg-light">
                <h5 className="modal-title fw-bold outfit-font text-dark">{active.title} <small className="text-muted ms-2 opacity-50">#{active.requestId}</small></h5>
                <button type="button" className="btn-close" onClick={() => setActive(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="card border-0 shadow-sm rounded-3 p-3 mb-4">
                  <p className="text-secondary mb-0 fw-medium" style={{ lineHeight: 1.6 }}>{active.description}</p>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <label className="text-muted d-block text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Priority</label>
                    <span className={`badge px-3 py-2 rounded-pill grad-${active.priority === 'High' ? 'rose' : active.priority === 'Medium' ? 'amber' : 'emerald'} shadow-sm`}>{active.priority}</span>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted d-block text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Department</label>
                    <span className="fw-bold text-dark">{active.department || active.category || 'N/A'}</span>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted d-block text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Created On</label>
                    <div className="fw-medium text-dark">{formatDate(active.createdAt)}</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded-4 shadow-sm border border-dashed border-primary border-opacity-25">
                  <h6 className="fw-bold mb-3 d-flex align-items-center outfit-font text-primary">
                    <span className="me-2">⚡</span> Quick Actions & Assignment
                  </h6>
                  <div className="row align-items-end g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Assign to Staff</label>
                      <select
                        className="form-select border-0 bg-light rounded-3 fw-medium"
                        value={active.assignedTo?._id || active.assignedTo || ""}
                        onChange={(e) => patchRequest(active._id, { assignedTo: e.target.value }).then(updated => setActive(updated))}
                      >
                        <option value="">Unassigned</option>
                        {users.filter(u => u.role === 'staff').map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.department || 'Staff'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 d-flex gap-2">
                      <button className="btn btn-success flex-grow-1 fw-bold rounded-3 shadow-sm py-2" onClick={() => patchRequest(active._id, { status: "Approved" }).then(updated => setActive(updated))}>Approve</button>
                      <button className="btn btn-danger flex-grow-1 fw-bold rounded-3 shadow-sm py-2" onClick={() => patchRequest(active._id, { status: "Rejected" }).then(updated => setActive(updated))}>Reject</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 bg-light">
                <button type="button" className="btn btn-white fw-bold px-4 border rounded-3" onClick={() => setActive(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function exportCSV(items) {
  if (!items || !items.length) return;
  const rows = [['ID', 'Title', 'Requester', 'Status']];
  items.forEach(r => rows.push([r.requestId, r.title, r.ownerEmail || r.createdBy, r.status]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'requests_export.csv';
  a.click();
}
