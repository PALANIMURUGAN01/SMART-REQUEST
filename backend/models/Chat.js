const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "admin", "bot"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  messages: [chatMessageSchema],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Chat", chatSchema);
