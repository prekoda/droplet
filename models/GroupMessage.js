const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  replyTo: String,
  time: { type: Date, default: Date.now },
  fileType: String,
  fileData: String,
  reactions: Object
});

// TTL index for 24 hours
groupMessageSchema.index({ time: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

module.exports = mongoose.model("GroupMessage", groupMessageSchema);
