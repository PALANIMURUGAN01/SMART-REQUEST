const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendAdminNotification = async (userEmail, messageText) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    await transporter.sendMail({
      from: `"SRLM Support Bot" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Message from ${userEmail}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eef2f7; border-radius: 12px;">
          <div style="background-color: #4f46e5; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; font-weight: bold;">
            New Support Chat Message
          </div>
          <div style="padding: 20px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 5px;">From: <strong>${userEmail}</strong></p>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 15px; color: #1e293b; line-height: 1.5;">
              "${messageText}"
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                Reply in Dashboard
              </a>
            </div>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Email sendAdminNotification error:', err.message);
  }
};

exports.sendUserNotification = async (userEmail, messageText) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    if (!userEmail || userEmail === "User") return;

    await transporter.sendMail({
      from: `"SRLM Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `New Reply from SRLM Support`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eef2f7; border-radius: 12px;">
          <div style="background-color: #4f46e5; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; font-weight: bold;">
            Support Team Response
          </div>
          <div style="padding: 20px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">The support team has replied to your chat:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 15px; color: #1e293b; line-height: 1.5; font-style: italic;">
              "${messageText}"
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                Open Chat Room
              </a>
            </div>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Email sendUserNotification error:', err.message);
  }
};

exports.sendStatusNotification = async (userEmail, userName, requestTitle, requestId, newStatus, rejectionReason = null, resolutionMessage = null) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    if (!userEmail) return;

    const statusColors = {
      'Approved': '#10b981', // Emerald
      'Resolved': '#10b981', // Emerald
      'Rejected': '#f43f5e', // Rose
      'In Progress': '#4f46e5', // Indigo
      'Pending': '#f59e0b', // Amber
    };

    const statusMessages = {
      'Approved': `Great news! Your request "${requestTitle}" has been approved by the administration.`,
      'Rejected': `Your request "${requestTitle}" was reviewed and has been rejected at this time.`,
      'In Progress': `Work has started on your request "${requestTitle}". Our team is on it!`,
      'Resolved': `This request has been marked as resolved. We hope we could help!`,
    };

    const accentColor = statusColors[newStatus] || '#6366f1';
    const message = statusMessages[newStatus] || `The status of your request "${requestTitle}" was updated to: ${newStatus}.`;
    const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/my-requests`;

    await transporter.sendMail({
      from: `"SRLM Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `SRLM Request Update: #${requestId} is ${newStatus}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: ${accentColor}15; color: ${accentColor}; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${newStatus}
            </div>
          </div>
          
          <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 20px;">Request Status Updated</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${accentColor};">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: bold;">Request Details</p>
            <p style="margin: 0; color: #1e293b; font-size: 16px;"><strong>#${requestId}</strong>: ${requestTitle}</p>
            ${rejectionReason ? `
              <div style="margin-top: 15px; padding: 12px; background: #fee2e2; border-radius: 6px; border: 1px solid #fecaca; color: #991b1b; font-size: 14px;">
                <strong>Reason for Rejection:</strong><br>
                ${rejectionReason}
              </div>
            ` : ''}
            ${resolutionMessage ? `
              <div style="margin-top: 15px; padding: 12px; background: #dcfce7; border-radius: 6px; border: 1px solid #bbf7d0; color: #166534; font-size: 14px;">
                <strong>Resolution Details:</strong><br>
                ${resolutionMessage}
              </div>
            ` : ''}
          </div>

          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
            Hello ${userName || 'Valued User'},<br><br>
            ${message}
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${dashboardLink}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">
              View Full Details
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
            This is an automated notification from SRLM support.<br>
            Please do not reply directly to this email.
          </p>
        </div>
      `
    });

    console.log(`✅ Status email sent to ${userEmail} for request #${requestId} → ${newStatus}`);
  } catch (err) {
    console.error('Email sendStatusNotification error:', err.message);
  }
};

exports.sendNewRequestAdminAlert = async (requestTitle, requestDesc, requestId, dbId, userName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    // Use EMAIL_USER as the admin email by default for this project
    const adminEmail = process.env.EMAIL_USER;

    const approveLink = `http://localhost:5000/requests/${dbId}/quick-approve`;
    const rejectLink = `http://localhost:5000/requests/${dbId}/quick-reject`;

    await transporter.sendMail({
      from: `"SRLM Admin Alerts" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Action Required: New SRLM Request #${requestId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0; font-size: 22px;">New Request Submitted</h2>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>User:</strong> ${userName || 'A user'}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${requestTitle}</p>
            <p style="margin: 5px 0; color: #475569; font-size: 14px;"><strong>Description:</strong> ${requestDesc}</p>
          </div>
          <p style="margin-bottom: 25px; color: #64748b; font-size: 14px;">Review this request quickly using the buttons below:</p>
          
          <div style="display: flex; gap: 15px;">
            <a href="${approveLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              ✅ Approve
            </a>
            <a href="${rejectLink}" style="background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              ❌ Reject
            </a>
          </div>

          <p style="margin-top: 35px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; pt: 15px;">
            Or log in to the <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin" style="color: #4f46e5;">Admin Dashboard</a> to manage all requests.
          </p>
        </div>
      `
    });

    console.log(`✅ Admin Alert email sent for new request #${requestId}`);
  } catch (err) {
    console.error('Email sendNewRequestAdminAlert error:', err.message);
  }
};
