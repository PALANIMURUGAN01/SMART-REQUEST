const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  department: String,
  role: {
    type: String,
    default: "user"
  },
  permissions: {
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: true }
  },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true },
    soundAlerts: { type: Boolean, default: false },
    statusColors: {
      pending: { type: String, default: 'warning' },
      'in progress': { type: String, default: 'info' },
      resolved: { type: String, default: 'success' },
      rejected: { type: String, default: 'danger' }
    }
  }
});

module.exports = mongoose.model("User", userSchema);
