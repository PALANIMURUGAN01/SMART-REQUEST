const express = require("express");
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

const app = express();

app.use(cors());
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
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mini2_db")
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
    res.json(newRequest);
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
    } else if (updateData.status === "Rejected") {
      updateData.rejectedAt = new Date();
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!updatedRequest) return res.status(404).json({ error: "Request not found" });
    res.json(updatedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
    const requests = await Request.find({ createdBy: userId }).sort({ createdAt: 1 });

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
    const requests = await Request.find({ assignedTo: staffId }).sort({ requestId: 1 }).populate("createdBy", "name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
