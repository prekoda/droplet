// DM collection: direct messages (stored forever).
const mongoose = require("mongoose");

const dmSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  replyTo: String,
  time: { type: Date, default: Date.now },
  fileType: String,
  fileData: String
});

module.exports = mongoose.model("DM", dmSchema);
