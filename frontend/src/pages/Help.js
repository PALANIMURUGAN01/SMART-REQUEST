import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLifeBuoy, FiSearch, FiHelpCircle, FiPhone, FiMail, FiMessageSquare, FiBookOpen, FiArrowRight, FiCheckCircle, FiChevronDown, FiAlertCircle } from "react-icons/fi";

export default function Help() {
  const [activeTab, setActiveTab] = useState("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I create a new request?",
      searchText: "create new request raise submit dashboard",
      answer: (
        <div className="text-secondary">
          <p>Follow these steps to raise a new request in SRLM:</p>
          <ol className="ps-3 mb-0">
            <li className="mb-2">Log in to your <strong>SRLM account</strong>.</li>
            <li className="mb-2">Go to the <strong>Dashboard</strong>.</li>
            <li className="mb-2">Click on the <strong>New Request</strong> button.</li>
            <li className="mb-2">
              Fill in the required details:
              <ul className="mt-1 small">
                <li>Request Title</li>
                <li>Category</li>
                <li>Priority Level</li>
                <li>Description</li>
              </ul>
            </li>
            <li className="mb-2">Attach <strong>supporting files</strong> if required.</li>
            <li>Click <strong>Submit</strong>.</li>
          </ol>
        </div>
      ),
    },
    {
      question: "How do I track my request status?",
      searchText: "track request status my requests sidebar request id title",
      answer: (
        <div className="text-secondary text-secondary">
          <p>Follow these steps to track your request in SRLM:</p>
          <ul className="list-unstyled mb-0">
            <li className="mb-2 d-flex gap-2 align-items-center"><FiArrowRight className="text-primary" /> Navigate to <strong>My Requests</strong>.</li>
            <li className="mb-2 d-flex gap-2 align-items-center"><FiArrowRight className="text-primary" /> Locate your request using the <strong>Request ID</strong> or <strong>Title</strong>.</li>
            <li className="d-flex gap-2 align-items-center"><FiArrowRight className="text-primary" /> Check the real-time <strong>System Status</strong>.</li>
          </ul>
        </div>
      ),
    },
    {
      question: "What does 'Priority' mean?",
      searchText: "priority urgent high medium low",
      answer: "Priority indicates the urgency of your submission. High priority requests are processed first, followed by Medium and Low. Please use High priority only for critical system failures.",
    },
    {
      question: "Can I edit a request after submitting?",
      searchText: "edit request submitting pending in progress comments",
      answer: (
        <div className="text-secondary">
            <p>Yes, requests can be edited <strong>only while in 'Pending' status</strong>.</p>
            <p className="mb-1">Once a Specialist accepts the task ('In Progress'), the request is locked to ensure operational consistency.</p>
            <div className="p-3 bg-light rounded-3 mt-3 d-flex gap-2 border">
               <FiAlertCircle className="text-warning mt-1" />
               <span className="small fw-semibold">If further context is needed for a locked request, utilize the live chat feature to message the assigned Specialist.</span>
            </div>
        </div>
      ),
    },
    {
      question: "What is the expected resolution timeline?",
      searchText: "resolve time duration high medium low priority workload",
      answer: (
        <div className="text-secondary">
          <p>Timelines vary based on the <strong>Priority Metric</strong> and current system workload:</p>
          <div className="d-flex flex-column gap-2 mb-3 mt-3">
             <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-danger bg-opacity-10 rounded-2 border border-danger border-opacity-25">
                <span className="fw-bold small text-danger uppercase">High Priority</span>
                <span className="small fw-bold">Immediate Action</span>
             </div>
             <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-warning bg-opacity-10 rounded-2 border border-warning border-opacity-25">
                <span className="fw-bold small text-warning uppercase">Medium Priority</span>
                <span className="small fw-bold">Standard Queue</span>
             </div>
             <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-success bg-opacity-10 rounded-2 border border-success border-opacity-25">
                <span className="fw-bold small text-success uppercase">Low Priority</span>
                <span className="small fw-bold">Maintenance Queue</span>
             </div>
          </div>
          <p className="small mb-0">Track exact progress in your personal <strong>Activity Log</strong> on the Dashboard.</p>
        </div>
      ),
    },
    {
      question: "What information should I provide?",
      searchText: "description include details error message screenshot location department",
      answer: (
        <div className="text-secondary">
          <p>For precision resolution, please provide:</p>
          <ul className="ps-3 mb-0">
            <li className="mb-1">Exact location or workstation ID.</li>
            <li className="mb-1">Detailed description of the issue.</li>
            <li className="mb-1">Specific error messages or codes.</li>
            <li className="mb-1">Supporting visual evidence (Screenshots/PDFs).</li>
          </ul>
        </div>
      ),
    },
  ];

  const contactMethods = [
    { method: "Email Support", value: "admin@srlm.com", icon: <FiMail />, color: "indigo" },
    { method: "Phone Line", value: "04295-2260000", icon: <FiPhone />, color: "amber" },
    { method: "System Status", value: "Online (24x7)", icon: <FiCheckCircle />, color: "emerald" },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.searchText || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-fluid pt-4 pb-5 px-lg-5 animate-fade-in">
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        {/* Elite Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-4 border-bottom pb-4">
           <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 grad-indigo rounded-circle text-white shadow-sm"><FiLifeBuoy size={22} /></div>
              <div>
                 <h2 className="mb-0 fw-bold text-dark outfit-font">Help & Support Center</h2>
                 <p className="text-muted small mb-0">Operational assistance, system guides, and administrative contact.</p>
              </div>
           </div>
           <div className="d-flex gap-2 p-1 bg-white border rounded-3 shadow-sm">
             {[
               { id: 'faq', label: 'FAQ', icon: <FiHelpCircle /> },
               { id: 'guides', label: 'Guides', icon: <FiBookOpen /> },
               { id: 'contact', label: 'Contact', icon: <FiPhone /> }
             ].map(v => (
               <button key={v.id} className={`btn btn-sm px-4 py-2 rounded-2 border-0 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === v.id ? 'grad-indigo text-white shadow-sm' : 'btn-light text-muted'}`} onClick={() => setActiveTab(v.id)}>
                  {v.icon} {v.label}
               </button>
             ))}
           </div>
        </div>

        {/* FAQ Experience */}
        {activeTab === "faq" && (
          <div className="animate-up">
            <div className="mb-5 position-relative">
              <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-4 text-muted" size={18} />
              <input
                type="text"
                className="form-control form-control-lg border shadow-sm rounded-4 ps-5 py-3 fw-medium"
                placeholder="Search the system's operational knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="row g-4">
               <div className="col-lg-12">
                  <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
                    {filteredFaqs.map((faq, idx) => (
                      <div className={`faq-item border-bottom ${openFaq === idx ? 'bg-light bg-opacity-50' : ''} transition-all`} key={idx}>
                         <button
                           className="btn w-100 text-start d-flex justify-content-between align-items-center px-4 py-3 shadow-none bg-transparent rounded-0"
                           onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                         >
                           <span className={`fw-bold text-dark outfit-font ${openFaq === idx ? 'text-primary' : ''}`}>{faq.question}</span>
                           <FiChevronDown className={`text-muted transition-all ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                         </button>
                         {openFaq === idx && (
                           <div className="px-4 pb-4 animate-fade-in">
                              <div className="p-3 bg-white rounded-3 border-start border-primary border-4 shadow-sm fw-medium" style={{ fontSize: '15px' }}>
                                 {faq.answer}
                              </div>
                           </div>
                         )}
                      </div>
                    ))}
                    {filteredFaqs.length === 0 && (
                       <div className="p-5 text-center text-muted fw-bold animate-fade-in">
                          <FiAlertCircle size={32} className="mb-3 opacity-25" />
                          <div>No operational intel found matching your search.</div>
                       </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Contact Intelligence */}
        {activeTab === "contact" && (
          <div className="animate-up">
            <div className="row g-4 mb-5">
              {contactMethods.map((item) => (
                <div key={item.method} className="col-12 col-md-4">
                  <div className={`clean-card h-100 card-accent-${item.color}`}>
                    <div className="card-body text-center p-5">
                      <div className={`d-inline-flex align-items-center justify-content-center bg-${item.color} bg-opacity-10 text-${item.color} rounded-circle mb-3 shadow-sm border border-${item.color} border-opacity-25`} style={{ width: "68px", height: "68px", fontSize: "24px" }}>
                        {item.icon}
                      </div>
                      <h5 className="fw-bold text-dark mb-1 outfit-font">{item.method}</h5>
                      <p className={`fw-bold small text-${item.color} mb-0`}>{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card shadow-sm border-0 rounded-5 overflow-hidden bg-white animate-up position-relative">
               <div className="row g-0">
                  <div className="col-md-5 bg-light p-5 d-flex align-items-center justify-content-center border-end">
                     <div className="text-center">
                        <FiMessageSquare size={80} className="text-primary opacity-10 mb-4" />
                        <h3 className="fw-black text-dark outfit-font mb-0">Live Desk</h3>
                        <p className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '2px' }}>Real-Time Support</p>
                     </div>
                  </div>
                  <div className="col-md-7 p-5">
                     <h4 className="fw-bold text-dark outfit-font mb-3">Initiate Live Consultation</h4>
                     <p className="text-muted fw-medium mb-4" style={{ fontSize: '15px', lineHeight: 1.8 }}>
                        Need immediate operational bandwidth? Our specialists are synchronized to assist you with complex requests and technical difficulties in real-time.
                     </p>
                     <div className="p-3 bg-primary bg-opacity-5 rounded-4 border border-primary border-opacity-10 d-flex gap-3 align-items-center">
                        <div className="p-2 bg-primary text-white rounded-circle"><FiCheckCircle /></div>
                        <div className="small fw-bold text-dark">Look for the "Support Hub" icon in the sidebar to begin.</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Operational Guides Showcase */}
        {activeTab === "guides" && (
          <div className="animate-up">
            <div className="row g-4 mb-4">
              {[
                { title: "Getting Started", icon: "📋", c: "indigo", text: "New to the system? Step-by-step masterclass on creating, tracking, and managing your request lifecycle smoothly.", path: "/help/guide/getting-started" },
                { title: "Strategic Success", icon: "🎯", c: "emerald", text: "Master of requests: Techniques for writing effective descriptions and providing context for precision resolutions.", path: "/help/guide/best-practices" }
              ].map(g => (
                <div key={g.title} className="col-12 col-md-6">
                   <div className={`clean-card h-100 card-accent-${g.c} overflow-hidden`}>
                      <div className="card-body p-5">
                         <div className="d-flex align-items-center gap-3 mb-4">
                            <div className={`icon-box-${g.c} p-3 rounded-4 shadow-sm text-white`}>
                               <span className="fs-3">{g.icon}</span>
                            </div>
                            <h4 className="fw-bold text-dark mb-0 outfit-font">{g.title}</h4>
                         </div>
                         <p className="text-muted fw-medium mb-5" style={{ lineHeight: 1.8 }}>{g.text}</p>
                         <button className={`btn btn-${g.c} text-white fw-bold px-4 py-2.5 rounded-3 shadow border-0 text-uppercase small`} style={{ letterSpacing: '1px' }} onClick={() => navigate(g.path)}>Access Manual</button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`.faq-item:last-child { border-bottom: none !important; }.rotate-180 { transform: rotate(180deg); }.faq-item:hover { background: rgba(0,0,0,0.01); }`}</style>
    </div>
  );
}
