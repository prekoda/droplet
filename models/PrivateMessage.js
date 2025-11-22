const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  replyTo: String,
  time: { type: Date, default: Date.now },
  fileType: String,
  fileData: String
});

// TTL index for 30 days
privateMessageSchema.index({ time: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("PrivateMessage", privateMessageSchema);
