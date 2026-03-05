import { useState, useEffect } from "react";
import { FiActivity, FiPieChart, FiBarChart2, FiFileText, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [reportType, setReportType] = useState("summary");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role?.toLowerCase() === 'admin';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        let url = "http://localhost:5000/requests";
        if (!isAdmin) {
          if (user.role?.toLowerCase() === 'staff') {
            url = `http://localhost:5000/assigned-requests/${user._id}`;
          } else {
            url = `http://localhost:5000/user-requests/${user._id}`;
          }
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Backend returns { stats, requests } for user-requests, but just [requests] for others
          const fetchedRequests = (isAdmin || user.role?.toLowerCase() === 'staff') ? data : data.requests;
          setRequests(fetchedRequests || []);
        } else {
          setError("Failed to fetch data for reports.");
        }
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        setError("Error connecting to server.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAdmin, user._id]);

  // Dynamic Calculations
  const calculateStats = () => {
    const total = requests?.length || 0;

    // Default structure for no data
    if (total === 0) {
      return {
        summary: [
          { label: "Total Requests", value: "0", icon: <FiFileText />, color: "primary" },
          { label: "Completed", value: "0", icon: <FiCheckCircle />, color: "success" },
          { label: "In Progress", value: "0", icon: <FiActivity />, color: "info" },
          { label: "Pending Approval", value: "0", icon: <FiClock />, color: "warning" },
        ],
        priority: [],
        category: []
      };
    }

    // 1. Summary Metrics
    const completed = requests.filter(r => r && (r.status === 'Approved' || r.status === 'Resolved')).length;
    const inProgress = requests.filter(r => r && r.status === 'In Progress').length;
    const pending = requests.filter(r => r && r.status === 'Pending').length;

    // 2. Priority Distribution
    const priorities = ["High", "Medium", "Low"];
    const priorityData = priorities.map(p => {
      const count = requests.filter(r => r && r.priority === p).length;
      return {
        priority: p,
        count,
        percentage: Math.round((count / total) * 100) || 0
      };
    });

    // 3. Category Breakdown
    const categoryMap = {};
    requests.forEach(r => {
      if (!r) return;
      const cat = r.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryData = Object.keys(categoryMap).map(cat => ({
      category: cat,
      count: categoryMap[cat],
      percentage: Math.round((categoryMap[cat] / total) * 100) || 0
    })).sort((a, b) => b.count - a.count);

    return {
      summary: [
        { label: "Total Requests", value: total.toString(), icon: <FiFileText />, color: "primary" },
        { label: "Completed", value: completed.toString(), icon: <FiCheckCircle />, color: "success" },
        { label: "In Progress", value: inProgress.toString(), icon: <FiActivity />, color: "info" },
        { label: "Pending Approval", value: pending.toString(), icon: <FiClock />, color: "warning" },
      ],
      priority: priorityData,
      category: categoryData
    };
  };

  const stats = calculateStats() || { summary: [], priority: [], category: [] };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("System Analytics Report", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Report Type: ${reportType.toUpperCase()}`, 14, 36);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Executive Summary", 14, 48);

    const summaryData = stats.summary.map(s => [s.label, s.value]);
    autoTable(doc, {
      startY: 52,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Priority Section
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Priority Distribution", 14, finalY);
    const priorityData = stats.priority.map(p => [p.priority, p.count, `${p.percentage}%`]);
    autoTable(doc, {
      startY: finalY + 4,
      head: [["Priority", "Count", "Percentage"]],
      body: priorityData,
      theme: 'striped',
      headStyles: { fillColor: [244, 67, 54] }
    });

    // Category Section
    finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Category Breakdown", 14, finalY);
    const categoryData = stats.category.map(c => [c.category, c.count, `${c.percentage}%`]);
    autoTable(doc, {
      startY: finalY + 4,
      head: [["Category", "Count", "Percentage"]],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [76, 175, 80] }
    });

    doc.save(`system_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Calculating analytics...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid pt-3 pb-4 px-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h1 className="mb-0 fw-bold text-dark outfit-font" style={{ fontSize: '1.8rem' }}>Reports & Analytics</h1>
          <p className="text-muted small mb-0">
            {isAdmin ? "Global system-wide performance & request metrics" : "Personal request performance & history tracking"}
          </p>
        </div>
        <div className="btn-group shadow-sm bg-white rounded-3 p-1 border">
          <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${reportType === 'summary' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setReportType("summary")}>
            <FiPieChart size={14} className="me-1" /> Summary
          </button>
          <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${reportType === 'priority' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setReportType("priority")}>
            <FiBarChart2 size={14} className="me-1" /> Priority
          </button>
          <button className={`btn btn-sm px-3 rounded-2 border-0 fw-bold ${reportType === 'category' ? 'grad-indigo shadow-sm' : 'btn-light text-muted'}`} onClick={() => setReportType("category")}>
            <FiActivity size={14} className="me-1" /> Category
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4">
          <FiAlertCircle className="me-2" /> {error}
        </div>
      )}

      {/* Summary View */}
      {reportType === "summary" && (
        <div className="row g-3">
          {stats.summary.map((metric) => (
            <div key={metric.label} className="col-md-3">
              <div className={`clean-card h-100 card-interactive card-accent-${metric.color === 'primary' ? 'indigo' : metric.color === 'warning' ? 'amber' : metric.color === 'success' ? 'emerald' : 'indigo'}`}>
                <div className="card-body d-flex justify-content-between align-items-center p-3">
                  <div>
                    <div className="small fw-bold text-uppercase mb-1 text-muted" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>{metric.label}</div>
                    <div className="fw-bold outfit-font text-dark" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{metric.value}</div>
                  </div>
                  <div className={`icon-box-${metric.color === 'primary' ? 'indigo' : metric.color === 'warning' ? 'amber' : metric.color === 'success' ? 'emerald' : 'indigo'} p-3 rounded-4 shadow-sm text-primary`}>
                    {metric.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="col-lg-8">
            <div className="clean-card h-100">
              <div className="card-header bg-white py-2 px-3 border-0 mt-1">
                <h6 className="mb-0 fw-bold outfit-font text-dark text-uppercase small opacity-75" style={{ letterSpacing: '0.05em' }}>Recent Trends</h6>
              </div>
              <div className="card-body p-3 text-center">
                <div className="py-4 bg-light rounded-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '150px' }}>
                  <FiTrendingUp size={32} className="text-primary mb-2 opacity-25" />
                  <p className="text-muted mb-0 small px-4">Historical trending charts will be available once more data is collected.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="clean-card h-100 card-accent-indigo">
              <div className="card-body p-3 d-flex flex-column">
                <h6 className="fw-bold mb-3 outfit-font text-dark text-uppercase small opacity-75" style={{ letterSpacing: '0.05em' }}>Quick Stats</h6>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small mb-1" style={{ fontSize: '12px' }}>
                    <span className="text-muted fw-medium">Approval Rate</span>
                    <span className="fw-bold text-primary">{(Number(stats.summary[0]?.value) || 0) > 0 ? Math.round((Number(stats.summary[1]?.value) || 0) / (Number(stats.summary[0]?.value) || 1) * 100) : 0}%</span>
                  </div>
                  <div className="progress bg-light" style={{ height: "6px" }}>
                    <div className="progress-bar grad-indigo rounded-pill" style={{ width: `${(Number(stats.summary[0]?.value) || 0) > 0 ? (Number(stats.summary[1]?.value) || 0) / (Number(stats.summary[0]?.value) || 1) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-muted mb-0 d-flex align-items-center" style={{ fontSize: '11px' }}>
                    <FiActivity size={12} className="me-1 text-primary" /> Real-time data updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority View */}
      {reportType === "priority" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden border">
          <div className="card-header bg-white py-3 px-4 border-0 mt-1">
            <h5 className="mb-0 fw-bold outfit-font">Priority Distribution</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Priority Level</th>
                    <th className="py-3 text-center small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Count</th>
                    <th className="py-3 text-center small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Percentage</th>
                    <th className="pe-4 py-3 small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.priority.map((row) => (
                    <tr key={row.priority}>
                      <td className="ps-4 fw-bold">
                        <span className={`me-3 badge grad-${row.priority === "High" ? "rose" : row.priority === "Medium" ? "amber" : "emerald"} rounded-circle p-1`} style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                        {row.priority}
                      </td>
                      <td className="text-center fw-medium">{row.count}</td>
                      <td className="text-center fw-bold text-primary">{row.percentage}%</td>
                      <td className="pe-4" style={{ minWidth: "200px" }}>
                        <div className="progress rounded-pill bg-light shadow-none" style={{ height: "6px" }}>
                          <div
                            className={`progress-bar rounded-pill grad-${row.priority === "High" ? "rose" : row.priority === "Medium" ? "amber" : "emerald"}`}
                            role="progressbar"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {requests.length === 0 && <div className="p-5 text-center text-muted">No requests found to calculate priorities.</div>}
          </div>
        </div>
      )}

      {/* Category View */}
      {reportType === "category" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden border">
          <div className="card-header bg-white py-3 px-4 border-0 mt-1">
            <h5 className="mb-0 fw-bold outfit-font">Category Breakdown</h5>
          </div>
          <div className="card-body p-4 bg-light">
            <div className="row g-3">
              {stats.category.length > 0 ? (
                stats.category.map((row) => (
                  <div key={row.category} className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="fw-bold text-dark mb-1 outfit-font">{row.category}</h6>
                          <p className="text-muted small mb-0">{row.count} requests</p>
                        </div>
                        <span className="badge grad-indigo rounded-3 px-2 py-1 shadow-sm" style={{ fontSize: '10px' }}>{row.percentage}%</span>
                      </div>
                      <div className="progress rounded-pill bg-light" style={{ height: "4px" }}>
                        <div
                          className="progress-bar rounded-pill grad-indigo"
                          role="progressbar"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 py-5 text-center text-muted card border-0 rounded-4">No request categories found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 d-flex gap-3">
        <button
          className="btn grad-indigo px-4 fw-bold py-2 rounded-3 shadow border-0"
          onClick={handleDownloadPDF}
        >
          <FiFileText className="me-2" /> Download Full PDF Report
        </button>
        <button className="btn btn-outline-primary px-4 fw-bold py-2 rounded-3 shadow-sm bg-white" onClick={() => window.print()}>
          <FiActivity className="me-2" /> Print Summary
        </button>
      </div>
    </div>
  );
}
