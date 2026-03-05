import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
        <div>
          <p>Follow these steps to raise a new request in SRLM:</p>
          <ol>
            <li>Log in to your <strong>SRLM account</strong>.</li>
            <li>Go to the <strong>Dashboard</strong>.</li>
            <li>Click on the <strong>Raise Request</strong> button.</li>
            <li>
              Fill in the required details:
              <ul className="mt-1">
                <li>Request Title</li>
                <li>Category</li>
                <li>Priority Level</li>
                <li>Description</li>
              </ul>
            </li>
            <li>Attach <strong>supporting files</strong> if required.</li>
            <li>Click <strong>Submit</strong>.</li>
          </ol>
        </div>
      ),
    },
    {
      question: "How do I track my request status?",
      searchText: "track request status my requests sidebar request id title",
      answer: (
        <div>
          <p>Follow these steps to track your request in SRLM:</p>
          <ol>
            <li>Go to <strong>My Requests</strong>.</li>
            <li>Locate your request using the <strong>Request ID</strong> or <strong>Title</strong>.</li>
            <li>Check the current <strong>status</strong>.</li>
          </ol>
        </div>
      ),
    },
    {
      question: "What does 'Priority' mean?",
      searchText: "priority urgent high medium low",
      answer: "Priority indicates how urgent your request is. High priority requests are attended to first, followed by Medium and Low.",
    },
    {
      question: "Can I edit a request after submitting?",
      searchText: "edit request submitting pending in progress comments",
      answer: (
        <div>
          <p>Yes, you can edit your request <strong>only if it is still in the Pending status</strong>.</p>
          <p>Once the request has been assigned to a staff member or moved to <strong>In Progress</strong>, editing will be disabled to maintain workflow consistency.</p>
          <p className="mb-0">💡 If you need to add more details, you can use the <strong>comments section</strong> to provide additional information.</p>
        </div>
      ),
    },
    {
      question: "How long does it take to resolve a request?",
      searchText: "resolve time duration high medium low priority workload",
      answer: (
        <div>
          <p>The resolution time depends on the <strong>priority and complexity</strong> of the request.</p>
          <ul className="list-unstyled mb-2">
            <li className="mb-1">🔴 <strong>High Priority</strong> → Resolved as quickly as possible</li>
            <li className="mb-1">🟡 <strong>Medium Priority</strong> → Standard processing time</li>
            <li className="mb-1">🟢 <strong>Low Priority</strong> → May take longer based on workload</li>
          </ul>
          <p className="mb-0">You can track the real-time progress and status from the <strong>My Requests</strong> section.</p>
        </div>
      ),
    },
    {
      question: "What should I include in the description?",
      searchText: "description include details error message screenshot location department",
      answer: (
        <div>
          <p>To ensure faster and accurate resolution, your description should include:</p>
          <ul>
            <li>A clear explanation of the issue or requirement</li>
            <li>Location or department <em>(if applicable)</em></li>
            <li>Error messages <em>(for technical issues)</em></li>
            <li>Date and time when the issue occurred</li>
            <li>Screenshots or supporting files <em>(if available)</em></li>
          </ul>
        </div>
      ),
    },
  ];

  const contactMethods = [
    { method: "Email", value: "support@srlm.com", icon: "📧" },
    { method: "Phone", value: "+1-555-0123", icon: "📱" },
    { method: "Live Chat", value: "Available 9 AM - 6 PM", icon: "💬" },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.searchText || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-fluid pt-4 pb-5 px-lg-5 animate-fade-in">
      <div className="mx-auto" style={{ maxWidth: '1000px' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 border-bottom pb-4">
          <div>
            <h2 className="mb-1 fw-bold text-dark outfit-font" style={{ fontSize: '1.8rem' }}>Help & Support</h2>
            <p className="text-muted small mb-0">Find answers, read guides, or contact our support team</p>
          </div>
          <div className="btn-group shadow-sm bg-white rounded-3 p-1 border">
            <button
              className={`btn btn-sm px-4 py-2 rounded-2 border-0 fw-bold transition-all ${activeTab === 'faq' ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
              onClick={() => setActiveTab("faq")}
            >
              📚 FAQ
            </button>
            <button
              className={`btn btn-sm px-4 py-2 rounded-2 border-0 fw-bold transition-all ${activeTab === 'contact' ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
              onClick={() => setActiveTab("contact")}
            >
              📞 Contact
            </button>
            <button
              className={`btn btn-sm px-4 py-2 rounded-2 border-0 fw-bold transition-all ${activeTab === 'guides' ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
              onClick={() => setActiveTab("guides")}
            >
              📖 Guides
            </button>
          </div>
        </div>

        {/* FAQ Tab */}
        {activeTab === "faq" && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-lg border-0 shadow-sm rounded-4 px-4 py-3"
                placeholder="🔍 Search FAQs by keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="accordion shadow-sm rounded-4 border overflow-hidden bg-white" id="faqAccordion">
              {filteredFaqs.map((faq, idx) => (
                <div className="accordion-item border-0 border-bottom" key={idx}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${openFaq === idx ? "fw-bold text-primary bg-light" : "collapsed fw-medium text-dark"}`}
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      style={{ cursor: "pointer", boxShadow: 'none' }}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  {openFaq === idx && (
                    <div className="accordion-collapse">
                      <div className="accordion-body px-4 py-3 text-secondary" style={{ lineHeight: 1.6 }}>
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="alert alert-info rounded-4 border-0 shadow-sm mt-4 p-4 text-center">
                <span className="fs-5 d-block mb-2">🤔</span>
                <span className="fw-medium">No matching FAQs found. Try different keywords.</span>
              </div>
            )}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="animate-fade-in">
            <div className="row g-4 mb-5 justify-content-center">
              {contactMethods.map((item) => (
                <div key={item.method} className="col-12 col-md-4">
                  <div className="clean-card h-100 card-interactive">
                    <div className="card-body text-center p-4">
                      <div className="d-inline-flex align-items-center justify-content-center bg-light text-primary rounded-circle mb-3 shadow-sm" style={{ width: "64px", height: "64px", fontSize: "28px" }}>
                        {item.icon}
                      </div>
                      <h6 className="card-title fw-bold text-dark mb-1 outfit-font">{item.method}</h6>
                      <p className="card-text text-primary small fw-bold mb-0">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row justify-content-center">
              <div className="col-12">
                <div className="clean-card overflow-hidden">
                  <div className="card-header bg-white border-bottom-0 pt-4 pt-md-5 px-4 px-md-5 pb-0 d-flex flex-column align-items-center text-center">
                    <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: "56px", height: "56px", fontSize: "24px" }}>
                      💬
                    </div>
                    <div>
                      <h5 className="card-title fw-bold outfit-font mb-1 text-dark">Send us a Message</h5>
                      <p className="text-muted small mb-0">Fill out the form below and our team will get back to you shortly.</p>
                    </div>
                  </div>
                  <div className="card-body p-4 p-md-5 pt-4">
                    <form>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>Your Name</label>
                          <input type="text" className="form-control border-0 shadow-sm rounded-3 bg-light px-3 py-2" placeholder="John Doe" />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>Email Address</label>
                          <input type="email" className="form-control border-0 shadow-sm rounded-3 bg-light px-3 py-2" placeholder="john@example.com" />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>Subject</label>
                        <input type="text" className="form-control border-0 shadow-sm rounded-3 bg-light px-3 py-2" placeholder="How can we help?" />
                      </div>
                      <div className="mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>Message Details</label>
                        <textarea
                          className="form-control border-0 shadow-sm rounded-3 bg-light px-3 py-3"
                          rows="5"
                          placeholder="Please describe your issue or inquiry in detail..."
                        ></textarea>
                      </div>
                      <button type="submit" className="btn grad-indigo w-100 fw-bold rounded-3 shadow border-0 py-2 d-flex justify-content-center align-items-center gap-2">
                        <span>📧</span> Send Message
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === "guides" && (
          <div className="animate-fade-in">
            {/* Guide Cards Row */}
            <div className="row g-4 mb-4 justify-content-center">
              <div className="col-md-6">
                <div className="clean-card h-100 card-interactive card-accent-indigo">
                  <div className="card-body d-flex flex-column p-4 p-lg-5">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-box-indigo p-3 rounded-4 shadow-sm me-3">
                        <span className="fs-4 d-block" style={{ lineHeight: 1 }}>📋</span>
                      </div>
                      <h4 className="card-title fw-bold text-dark mb-0 outfit-font">Getting Started</h4>
                    </div>
                    <p className="card-text text-muted flex-grow-1" style={{ lineHeight: 1.7 }}>
                      New to SRLM? A complete step-by-step guide to creating, tracking, and managing your requests seamlessly.
                    </p>
                    <button
                      className="btn grad-indigo text-white mt-4 fw-bold rounded-3 shadow align-self-start px-4 py-2 border-0"
                      onClick={() => navigate("/help/guide/getting-started")}
                    >
                      Read Guide →
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="clean-card h-100 card-interactive card-accent-emerald">
                  <div className="card-body d-flex flex-column p-4 p-lg-5">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-box-emerald p-3 rounded-4 shadow-sm me-3">
                        <span className="fs-4 d-block" style={{ lineHeight: 1 }}>🎯</span>
                      </div>
                      <h4 className="card-title fw-bold text-dark mb-0 outfit-font">Best Practices</h4>
                    </div>
                    <p className="card-text text-muted flex-grow-1" style={{ lineHeight: 1.7 }}>
                      Tips and tricks for writing effective requests, providing the right details, and getting faster, more accurate resolutions.
                    </p>
                    <button
                      className="btn btn-success mt-4 fw-bold rounded-3 shadow align-self-start px-4 py-2 border-0"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      onClick={() => navigate("/help/guide/best-practices")}
                    >
                      Read Guide →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
