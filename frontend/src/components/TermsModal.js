import React from 'react';

export default function TermsModal({ show, onClose }) {
    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Terms and Conditions</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <div className="modal-body text-start">
                            <ol className="list-group list-group-numbered list-group-flush">
                                <li className="list-group-item">Users must provide valid and accurate information while submitting requests.</li>
                                <li className="list-group-item">Each user is responsible for maintaining the confidentiality of their login credentials.</li>
                                <li className="list-group-item">Requests once submitted cannot be modified after approval or rejection.</li>
                                <li className="list-group-item">The system records all request activities for tracking and administrative purposes.</li>
                                <li className="list-group-item">Any misuse of the system may lead to account suspension.</li>
                                <li className="list-group-item">Approval or rejection of requests is based on institutional rules and administrative decisions.</li>
                                <li className="list-group-item">Users can view the status of their requests through the dashboard.</li>
                                <li className="list-group-item">This system is intended only for academic / organizational use.</li>
                            </ol>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
}
