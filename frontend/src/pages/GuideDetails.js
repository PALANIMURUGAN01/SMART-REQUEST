import { useParams, useNavigate } from "react-router-dom";

const guides = {
    "getting-started": {
        title: "📋 Getting Started — Complete User Guide",
        subtitle: "Everything you need to know to use SRLM effectively",
        color: "primary",
        sections: [
            {
                number: 1,
                badge: "bg-primary",
                title: "🚀 How do I create a Request?",
                content: (
                    <div>
                        <p className="text-muted">Follow these steps to raise a new request in the SRLM system:</p>
                        <ol>
                            <li className="mb-2">Log in to your <strong>SRLM account</strong>.</li>
                            <li className="mb-2">Go to the <strong>Dashboard</strong>.</li>
                            <li className="mb-2">Click on the <span className="badge bg-primary">Raise Request</span> button.</li>
                            <li className="mb-2">
                                Fill in the required details:
                                <ul className="mt-2">
                                    <li><strong>Request Title</strong></li>
                                    <li><strong>Category</strong></li>
                                    <li><strong>Priority Level</strong></li>
                                    <li><strong>Description</strong></li>
                                </ul>
                            </li>
                            <li className="mb-2">Attach <strong>supporting files</strong> if required.</li>
                            <li className="mb-2">Click <span className="badge bg-success">Submit</span>.</li>
                        </ol>
                    </div>
                ),
            },
            {
                number: 2,
                badge: "bg-info",
                title: "🔍 How to Track Your Request",
                content: (
                    <div>
                        <p className="text-muted">SRLM allows you to monitor your request status in real time.</p>
                        <ol className="mb-3">
                            <li className="mb-2">Go to <strong>My Requests</strong>.</li>
                            <li className="mb-2">Locate your request using the <strong>Request ID</strong> or <strong>Title</strong>.</li>
                            <li className="mb-2">Check the current <strong>status</strong>.</li>
                        </ol>
                        <p className="fw-semibold mb-2">Request Status Meaning:</p>
                        <table className="table table-bordered table-sm" style={{ maxWidth: "480px" }}>
                            <thead className="table-light">
                                <tr><th>Status</th><th>Meaning</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><span className="badge bg-warning text-dark">Pending</span></td><td>Waiting for admin review</td></tr>
                                <tr><td><span className="badge bg-primary">In Progress</span></td><td>Assigned to staff and being worked on</td></tr>
                                <tr><td><span className="badge bg-success">Completed</span></td><td>Issue resolved successfully</td></tr>
                                <tr><td><span className="badge bg-danger">Rejected</span></td><td>Request was not approved</td></tr>
                            </tbody>
                        </table>
                    </div>
                ),
            },
            {
                number: 3,
                badge: "bg-warning text-dark",
                title: "⚡ Understanding Priority Levels",
                content: (
                    <div className="d-flex flex-column gap-2" style={{ maxWidth: "520px" }}>
                        <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-danger-subtle">
                            <span className="badge bg-danger px-3 py-2">High</span>
                            <div><strong>Critical issue</strong> that needs immediate attention.</div>
                        </div>
                        <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-warning-subtle">
                            <span className="badge bg-warning text-dark px-3 py-2">Medium</span>
                            <div><strong>Normal service request</strong> with standard handling time.</div>
                        </div>
                        <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-success-subtle">
                            <span className="badge bg-success px-3 py-2">Low</span>
                            <div><strong>Minor issue</strong> or general request with flexible resolution time.</div>
                        </div>
                    </div>
                ),
            },
            {
                number: 4,
                badge: "bg-secondary",
                title: "✏️ Can I edit a request after submitting?",
                content: (
                    <div>
                        <p>Yes, you can edit your request <strong>only if it is still in the Pending status</strong>.</p>
                        <p>Once the request has been assigned to a staff member or moved to <strong>In Progress</strong>, editing will be disabled to maintain workflow consistency.</p>
                        <div className="alert alert-info d-flex gap-2 align-items-start py-2 px-3" style={{ maxWidth: "520px" }}>
                            <span>💡</span>
                            <span>If you need to add more details, use the <strong>comments section</strong> to provide additional information.</span>
                        </div>
                    </div>
                ),
            },
            {
                number: 5,
                badge: "bg-success",
                title: "⏱️ How long does it take to resolve a request?",
                content: (
                    <div>
                        <p>The resolution time depends on the <strong>priority and complexity</strong> of the request.</p>
                        <ul className="list-unstyled mb-3">
                            <li className="mb-2">🔴 <strong>High Priority</strong> → Resolved as quickly as possible</li>
                            <li className="mb-2">🟡 <strong>Medium Priority</strong> → Standard processing time</li>
                            <li className="mb-2">🟢 <strong>Low Priority</strong> → May take longer based on workload</li>
                        </ul>
                        <p className="text-muted">You can track the real-time progress and status from the <strong>My Requests</strong> section.</p>
                    </div>
                ),
            },
        ],
    },
    "best-practices": {
        title: "🎯 Best Practices",
        subtitle: "Tips for creating effective requests and getting faster resolutions",
        color: "success",
        sections: [
            {
                number: 1,
                badge: "bg-success",
                title: "📝 Write Clear Titles",
                content: (
                    <div>
                        <p>A good request title should be short but descriptive. Instead of:</p>
                        <div className="alert alert-danger py-2 px-3">❌ "Help me"</div>
                        <div className="alert alert-success py-2 px-3">✅ "Laptop not connecting to office Wi-Fi — 3rd Floor"</div>
                    </div>
                ),
            },
            {
                number: 2,
                badge: "bg-success",
                title: "📋 Fill All Required Fields",
                content: (
                    <div>
                        <p>Ensure you complete all required fields including:</p>
                        <ul>
                            <li><strong>Title</strong> — descriptive and concise</li>
                            <li><strong>Category</strong> — correct department or issue type</li>
                            <li><strong>Priority</strong> — accurate severity level</li>
                            <li><strong>Description</strong> — detailed explanation</li>
                        </ul>
                    </div>
                ),
            },
            {
                number: 3,
                badge: "bg-success",
                title: "📎 Attach Supporting Files",
                content: (
                    <div>
                        <p>Whenever possible, attach:</p>
                        <ul>
                            <li>Screenshots of the issue</li>
                            <li>Error messages or logs</li>
                            <li>Relevant documents</li>
                        </ul>
                        <p className="text-muted">This significantly speeds up the resolution process.</p>
                    </div>
                ),
            },
            {
                number: 4,
                badge: "bg-success",
                title: "🔔 Monitor Your Requests",
                content: (
                    <p>Regularly check <strong>My Requests</strong> for status updates and respond promptly if the support team needs more information.</p>
                ),
            },
        ],
    },
};

export default function GuideDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const guide = guides[id];

    if (!guide) {
        return (
            <div className="container-fluid p-4">
                <div className="alert alert-warning">
                    <h5>Guide Not Found</h5>
                    <p className="mb-2">The guide you're looking for doesn't exist.</p>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => navigate("/help")}>
                        ← Back to Help Center
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-lg-5">
            <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3 border-bottom pb-3">
                <div>
                    <h2 className="mb-1 fw-bold text-primary">{guide.title}</h2>
                    <p className="text-muted small mb-0">{guide.subtitle}</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <button
                        className="btn btn-sm btn-outline-secondary px-3 rounded-2 shadow-sm d-flex align-items-center gap-2"
                        onClick={() => navigate("/help")}
                    >
                        <span>←</span> Back to Help Center
                    </button>
                    <div className={`bg-${guide.color} bg-opacity-10 p-2 rounded-circle text-${guide.color} border border-${guide.color}-subtle`}>
                        <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '14px', fontWeight: 'bold' }}>?</div>
                    </div>
                </div>
            </div>

            <div className="row justify-content-center mt-5">
                <div className="col-lg-10">
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-5">
                        <div className="card-body p-4 p-md-5">
                            {guide.sections.map((section, idx) => (
                                <div key={idx}>
                                    {/* Section */}
                                    <div className="mb-5 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className="d-flex align-items-center gap-3 mb-4">
                                            <div
                                                className={`badge ${section.badge} rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
                                                style={{ width: "40px", height: "40px", fontSize: "16px", fontWeight: "bold", flexShrink: 0 }}
                                            >
                                                {section.number}
                                            </div>
                                            <h4 className="mb-0 fw-bold text-dark">{section.title}</h4>
                                        </div>
                                        <div className="ms-md-5 ps-md-2">
                                            <div className="guide-content-wrapper fs-6">
                                                {section.content}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider between sections */}
                                    {idx < guide.sections.length - 1 && <hr className="my-5 opacity-25" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer navigation */}
                    <div className="d-flex justify-content-between align-items-center py-4 border-top">
                        <button
                            className="btn btn-link btn-sm text-muted text-decoration-none p-0"
                            onClick={() => navigate("/help")}
                        >
                            ← Return to Help Overview
                        </button>
                        <span className="text-muted small fw-medium">SRLM Help & Support Center</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
