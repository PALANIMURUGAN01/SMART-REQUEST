// Override DNS to use Google DNS - fixes Atlas SRV lookup on restricted networks
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const User = require("./models/User");
const Request = require("./models/Request");
const Counter = require("./models/Counter");
const Chat = require("./models/Chat");
const Notification = require("./models/Notification");
const { sendAdminNotification, sendUserNotification, sendStatusNotification, sendNewRequestAdminAlert } = require("./utils/mailer");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3001").split(",").map(o => o.trim());
console.log(`🚀 CORS Enabled for: ${allowedOrigins.join(", ")}`);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  .then(async () => {
    console.log("MongoDB connected 🚀");

    // Auto-sync the request counter on startup
    try {
      const count = await Request.countDocuments();
      if (count === 0) {
        // Atomic reset
        await Counter.findOneAndUpdate(
          { id: "request_id" },
          { $set: { seq: 0 } },
          { upsert: true, new: true }
        );
        console.log("✅ Counter reset to 0 (no requests in DB)");
      } else {
        const maxRequest = await Request.findOne().sort({ requestId: -1 });
        const maxId = maxRequest?.requestId || 0;
        await Counter.findOneAndUpdate(
          { id: "request_id" },
          { $set: { seq: maxId } },
          { upsert: true, new: true }
        );
        console.log(`✅ Counter synced to ${maxId} (${count} requests in DB)`);
      }
      // Log verification
      const verify = await Counter.findOne({ id: "request_id" });
      console.log(`✅ Counter State: ${JSON.stringify(verify)}`);
    } catch (err) {
      console.error("❌ Counter sync error:", err.message);
    }
  })
  .catch(err => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("SRLM Backend Running 🚀");
});

// --- Auth Routes (Simplified) ---
app.post("/register", async (req, res) => {
  try {
    const userData = { ...req.body, role: req.body.role || "user" };
    const user = new User(userData);
    await user.save();
    res.json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fixed Admin Login
    if (email === "admin@gmail.com" && password === "234@") {
      let admin = await User.findOne({ email: "admin@gmail.com" });
      if (!admin) {
        admin = new User({
          name: "Administrator",
          email: "admin@gmail.com",
          password: "234@", // In real app, this would be hashed
          role: "admin",
          department: "IT Administration",
          permissions: { canView: true, canEdit: true },
          preferences: {
            statusColors: {
              pending: 'warning',
              'in progress': 'info',
              resolved: 'success',
              rejected: 'danger'
            }
          }
        });
        await admin.save();
      }
      return res.json({ message: "Admin login successful", user: admin });
    }

    const user = await User.findOne({ email, password }); // In real app, use hashing!
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Forgot Password ---
// Step 1: Verify email exists
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: "No account found with this email address" });
    res.json({ message: "Email verified. You may now reset your password.", userId: user._id, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Reset password
app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: "Email and new password are required" });
    if (newPassword.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: { password: newPassword } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/google", async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if not exists
      user = new User({
        name,
        email,
        role: "user",
        // In a real app, you might want to ask for dept/phone later
        department: "General",
        permissions: { canView: true, canEdit: true }
      });
      await user.save();
    }

    res.json({ message: "Google login successful", user });
  } catch (err) {
    console.error("Google verify error:", err);
    res.status(400).json({ error: "Google verification failed" });
  }
});

// --- User Management Routes (Admin Only) ---
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/users/:id", async (req, res) => {
  try {
    const { currentPassword, newPassword, permissions, preferences, ...otherData } = req.body;
    let updateData = { ...otherData };

    if (newPassword) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.password !== currentPassword) {
        return res.status(400).json({ error: "Current password incorrect" });
      }
      updateData.password = newPassword;
    }

    // Use dot notation to prevent overwriting entire nested objects
    if (permissions) {
      for (const [key, value] of Object.entries(permissions)) {
        updateData[`permissions.${key}`] = value;
      }
    }
    if (preferences) {
      for (const [key, value] of Object.entries(preferences)) {
        updateData[`preferences.${key}`] = value;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Request Routes ---
app.get("/requests", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: 1 })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/requests", upload.single("file"), async (req, res) => {
  try {
    // 1. Get and increment counter
    let counter = await Counter.findOneAndUpdate(
      { id: "request_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const deptValue = req.body.department || req.body.category || "Institute";

    // Parse createdBy if it's a string (which it is when sent via FormData)
    let createdBy = req.body.createdBy;
    if (typeof createdBy === 'string' && createdBy.startsWith('{')) {
      try {
        const parsed = JSON.parse(createdBy);
        createdBy = parsed.id || parsed._id || createdBy;
      } catch (e) {
        // Fallback to original
      }
    }

    const requestData = {
      ...req.body,
      createdBy,
      requestId: counter.seq,
      category: deptValue,
      department: deptValue,
      attachmentUrl: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null
    };

    const newRequest = new Request(requestData);
    await newRequest.save();

    // Populate user to get name for the email
    const populatedReq = await Request.findById(newRequest._id).populate("createdBy", "name email");

    if (populatedReq && populatedReq.createdBy) {
      sendNewRequestAdminAlert(
        populatedReq.title,
        populatedReq.description,
        populatedReq.requestId,
        populatedReq._id,
        populatedReq.createdBy.name
      );

      // Create In-App Notification for ALL Admins
      try {
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          const notif = new Notification({
            recipient: admin._id,
            title: "New Request Submitted",
            message: `User ${populatedReq.createdBy.name} submitted a new request: ${populatedReq.title}`,
            type: "new_request",
            link: "/admin"
          });
          await notif.save();
          io.to(admin._id.toString()).emit("newNotification", notif);
        }
      } catch (err) {
        console.error("Admin notification error:", err.message);
      }
    }

    res.json(populatedReq || newRequest);
  } catch (err) {
    console.error("Submission Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Update request (granular or status)
app.patch("/requests/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status === "Approved") {
      updateData.approvedAt = new Date();
    } else if (updateData.status === "Resolved") {
      updateData.resolvedAt = new Date();
    } else if (updateData.status === "Rejected") {
      updateData.rejectedAt = new Date();
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate("createdBy", "name email").populate("assignedTo", "name");

    if (!updatedRequest) return res.status(404).json({ error: "Request not found" });

    // 1. Staff Notification: If request was assigned or re-assigned
    if (updateData.assignedTo) {
      try {
        const notif = new Notification({
          recipient: updateData.assignedTo,
          title: "New Request Assigned",
          message: `Admin assigned request #${updatedRequest.requestId} ("${updatedRequest.title}") to you.`,
          type: "request_update",
          link: "/staff-dashboard"
        });
        await notif.save();
        io.to(updateData.assignedTo.toString()).emit("newNotification", notif);
      } catch (err) {
        console.error("Staff notification error:", err.message);
      }
    }

    // 2. Admin Notification: If request was resolved (by staff or admin)
    if (updateData.status === "Resolved") {
      try {
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          const notif = new Notification({
            recipient: admin._id,
            title: "Request Resolved",
            message: `Request #${updatedRequest.requestId} ("${updatedRequest.title}") has been marked as Resolved.`,
            type: "request_update",
            link: "/admin"
          });
          await notif.save();
          io.to(admin._id.toString()).emit("newNotification", notif);
        }
      } catch (err) {
        console.error("Admin resolution notification error:", err.message);
      }
    }

    // 3. User Notification: Send email and in-app notification if status changed
    if (updateData.status && updatedRequest.createdBy) {
      const user = updatedRequest.createdBy;
      sendStatusNotification(
        user.email,
        user.name,
        updatedRequest.title,
        updatedRequest.requestId,
        updateData.status,
        updateData.rejectionReason,
        updateData.resolutionMessage
      );

      // Create In-App Notification for User
      try {
        const notif = new Notification({
          recipient: user._id,
          title: "Request Status Updated",
          message: `Your request "${updatedRequest.title}" is now ${updateData.status}.`,
          type: "request_update",
          link: "/requests"
        });
        await notif.save();
        io.to(user._id.toString()).emit("newNotification", notif);
      } catch (err) {
        console.error("User notification error:", err.message);
      }
    }

    res.json(updatedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Quick-Approve via Email Link
app.get("/requests/:id/quick-approve", async (req, res) => {
  try {
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Approved", approvedAt: new Date() } },
      { new: true }
    ).populate("createdBy", "name email");

    if (!updatedRequest) {
      return res.status(404).send("<h2>Request Not Found or already deleted.</h2>");
    }

    // Also trigger the status notification to the user
    if (updatedRequest.createdBy) {
      const user = updatedRequest.createdBy;
      sendStatusNotification(
        user.email,
        user.name,
        updatedRequest.title,
        updatedRequest.requestId,
        "Approved"
      );
    }

    // Return a styled success page to show the admin who clicked the link
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SRLM - Request Approved</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
          .icon { font-size: 48px; display: inline-block; background: #d1fae5; color: #10b981; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; margin-bottom: 20px; }
          h2 { color: #1e293b; margin: 0 0 10px 0; }
          p { color: #64748b; margin: 0 0 30px 0; }
          a { display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h2>Request #${updatedRequest.requestId} Approved!</h2>
          <p>The request "<strong>${updatedRequest.title}</strong>" has been successfully approved.</p>
          <p style="font-size: 13px;">An email notification has been sent to the user.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin">Go to Dashboard</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("<h2>Internal Server Error</h2><p>" + err.message + "</p>");
  }
});

// Quick-Reject via Email Link
app.get("/requests/:id/quick-reject", async (req, res) => {
  try {
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Rejected", rejectedAt: new Date() } },
      { new: true }
    ).populate("createdBy", "name email");

    if (!updatedRequest) {
      return res.status(404).send("<h2>Request Not Found or already deleted.</h2>");
    }

    if (updatedRequest.createdBy) {
      const user = updatedRequest.createdBy;
      sendStatusNotification(
        user.email,
        user.name,
        updatedRequest.title,
        updatedRequest.requestId,
        "Rejected"
      );
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SRLM - Request Rejected</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
          .icon { font-size: 48px; display: inline-block; background: #fee2e2; color: #ef4444; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; margin-bottom: 20px; }
          h2 { color: #1e293b; margin: 0 0 10px 0; }
          p { color: #64748b; margin: 0 0 30px 0; }
          a { display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✕</div>
          <h2>Request #${updatedRequest.requestId} Rejected</h2>
          <p>The request "<strong>${updatedRequest.title}</strong>" has been rejected.</p>
          <p style="font-size: 13px;">The user has been notified via email.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin">Go to Dashboard</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("<h2>Internal Server Error</h2><p>" + err.message + "</p>");
  }
});

// Helper: Sync counter to actual DB state
async function syncCounter() {
  try {
    const count = await Request.countDocuments();
    if (count === 0) {
      await Counter.findOneAndUpdate(
        { id: "request_id" },
        { $set: { seq: 0 } },
        { upsert: true, new: true }
      );
      return { seq: 0, count: 0 };
    } else {
      const maxRequest = await Request.findOne().sort({ requestId: -1 });
      const maxId = maxRequest?.requestId || 0;
      await Counter.findOneAndUpdate(
        { id: "request_id" },
        { $set: { seq: maxId } },
        { upsert: true, new: true }
      );
      return { seq: maxId, count };
    }
  } catch (err) {
    console.error("Sync error:", err);
    throw err;
  }
}

// Delete Request (Single)
app.delete("/requests/:id", async (req, res) => {
  try {
    const deleted = await Request.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Request not found" });

    // Always sync after delete
    const state = await syncCounter();
    res.json({ message: "Deleted successfully", ...state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ALL Requests
app.delete("/requests", async (req, res) => {
  try {
    const result = await Request.deleteMany({});
    await Counter.findOneAndUpdate({ id: "request_id" }, { $set: { seq: 0 } }, { upsert: true });
    res.json({ message: `Deleted ${result.deletedCount} requests. Counter reset.`, count: 0, seq: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: Sync Counter
app.post("/sync-counter", async (req, res) => {
  try {
    const state = await syncCounter();
    res.json({ message: "Counter synced", ...state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: Counter Status
app.get("/counter-status", async (req, res) => {
  try {
    const counter = await Counter.findOne({ id: "request_id" });
    const count = await Request.countDocuments();
    const max = await Request.findOne().sort({ requestId: -1 });
    res.json({
      seq: counter?.seq || 0,
      dbCount: count,
      maxId: max?.requestId || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Dashboard Route ---
app.get("/user-requests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || userId === "undefined") {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }

    // 1. Get user's requests
    const requests = await Request.find({ createdBy: userId }).sort({ createdAt: 1 }).populate("assignedTo", "name");

    // 2. Calculate stats
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === "Pending").length,
      approved: requests.filter(r => r.status === "Approved" || r.status === "Resolved").length,
      rejected: requests.filter(r => r.status === "Rejected").length,
    };

    res.json({ stats, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Staff Assignment Route ---
app.get("/assigned-requests/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;
    if (!staffId || staffId === "undefined") {
      return res.status(400).json({ error: "Staff ID is required" });
    }
    const requests = await Request.find({ assignedTo: staffId }).sort({ requestId: 1 }).populate("createdBy", "name email").populate("assignedTo", "name");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Chat model and mailer already imported at top of file

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("New client connected to socket:", socket.id);

  // User joins their specific room
  socket.on("joinRoom", async ({ userId }) => {
    socket.join(userId);
    console.log(`User ${userId} joined their chat room`);
  });

  // Admin joins a specific user's room to reply
  socket.on("adminJoinRoom", ({ userId }) => {
    socket.join(userId);
    console.log(`Admin joined room: ${userId}`);
  });

  socket.on("sendMessage", async (data) => {
    const { userId, sender, text, userEmail } = data;
    try {
      // Find or create chat document
      let chat = await Chat.findOne({ userId });
      if (!chat) {
        chat = new Chat({ userId, messages: [] });
      }

      const newMessage = { sender, text, timestamp: new Date() };
      chat.messages.push(newMessage);
      chat.lastUpdated = new Date();
      await chat.save();

      // Emit to everyone in the room (both user and admin observing)
      io.to(userId).emit("receiveMessage", newMessage);

      // Trigger Email Notification
      if (sender === "user") {
        sendAdminNotification(userEmail || "User", text);
        // Create In-App Notification for ALL Admins
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          const notif = new Notification({
            recipient: admin._id,
            title: "New Message",
            message: `User ${userEmail || 'Client'} sent a message: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
            type: "chat",
            link: "/admin"
          });
          await notif.save();
          io.to(admin._id.toString()).emit("newNotification", notif);
        }
      } else if (sender === "admin") {
        sendUserNotification(userEmail || "User", text);
        // Create In-App Notification for User
        const notif = new Notification({
          recipient: userId, // userId in chat state is the user's ID
          title: "New Message from Support",
          message: `Admin: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
          type: "chat",
          link: "/dashboard"
        });
        await notif.save();
        io.to(userId).emit("newNotification", notif);
      }
    } catch (err) {
      console.error("Socket Send Message Error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// GET Chat History API
app.get("/chat/:userId", async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.params.userId });
    res.json(chat ? chat.messages : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET All Active Chats for Admin
app.get("/chats/all", async (req, res) => {
  try {
    const chats = await Chat.find().populate("userId", "name email").sort({ lastUpdated: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Notification Routes ---
app.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    let query = { recipient: userId };
    
    // If Admin, let them see EVERYTHING in the system (all activity)
    if (user && user.role?.toLowerCase() === 'admin') {
      query = {}; // All notifications
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/notifications/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/notifications/read-all/:userId", async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.params.userId, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.io`);
});
