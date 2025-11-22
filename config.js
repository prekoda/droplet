const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  wsPath: process.env.WS_PATH || "/ws",
  groupMessageTTL: process.env.GROUP_MESSAGE_TTL || "7d"
};
