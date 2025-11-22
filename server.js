import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

dotenv.config();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGODB_URI;
const GROUP_MESSAGE_TTL = 24 * 60 * 60; // 24 hours
const DM_MESSAGE_TTL = 30 * 24 * 60 * 60; // 30 days

async function startServer() {
  // ======= MONGODB SETUP =======
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }

  // ======= MODELS =======
  const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    passwordHash: String,
  });
  const User = mongoose.model("User", userSchema);

  const groupMessageSchema = new mongoose.Schema({
    username: String,
    message: String,
    replyTo: String,
    time: { type: Date, default: Date.now },
    fileType: String,
    fileData: String,
    reactions: { type: Map, of: String },
  });
  groupMessageSchema.index({ time: 1 }, { expireAfterSeconds: GROUP_MESSAGE_TTL });
  const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

  const privateMessageSchema = new mongoose.Schema({
    from: String,
    to: String,
    message: String,
    replyTo: String,
    time: { type: Date, default: Date.now },
    fileType: String,
    fileData: String,
  });
  privateMessageSchema.index({ time: 1 }, { expireAfterSeconds: DM_MESSAGE_TTL });
  const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);

  // ======= EXPRESS SETUP =======
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.static("public"));

  app.post("/login", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    let user = await User.findOne({ username });
    if (!user) user = await User.create({ username });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, username });
  });

  const server = http.createServer(app);

  // ======= WEBSOCKET =======
  const wss = new WebSocketServer({ server });
  const clients = new Map();

  wss.on("connection", (ws) => {
    let user = null;

    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg);

        if (!user && data.type === "auth") {
          const payload = jwt.verify(data.token, JWT_SECRET);
          user = payload.username;
          clients.set(ws, user);

          ws.send(JSON.stringify({ type: "welcome", username: user }));
          broadcastUsers();
          return;
        }

        if (!user) {
          ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
          return;
        }

        switch (data.type) {
          case "chat":
            const chatMsg = await GroupMessage.create({
              username: user,
              message: data.message,
              replyTo: data.replyTo,
            });
            broadcast({ type: "chat", ...chatMsg.toObject() });
            break;

          case "dm":
            const dmMsg = await PrivateMessage.create({
              from: user,
              to: data.to,
              message: data.message,
            });
            sendDM(dmMsg);
            break;

          case "reaction":
            const msgToUpdate = await GroupMessage.findOne({ _id: data.messageId });
            if (!msgToUpdate) return;
            msgToUpdate.reactions.set(user, data.emoji);
            await msgToUpdate.save();
            broadcast({
              type: "reaction-update",
              messageId: data.messageId,
              reactions: Object.fromEntries(msgToUpdate.reactions),
            });
            break;
        }
      } catch (err) {
        console.error(err);
        ws.send(JSON.stringify({ type: "error", message: err.message }));
      }
    });

    ws.on("close", () => {
      if (user) {
        clients.delete(ws);
        broadcastUsers();
      }
    });

    function broadcast(obj) {
      const msg = JSON.stringify(obj);
      for (const client of clients.keys()) {
        if (client.readyState === client.OPEN) client.send(msg);
      }
    }

    function broadcastUsers() {
      const users = Array.from(clients.values());
      broadcast({ type: "users", users });
    }

    function sendDM(dmMsg) {
      const msgObj = { type: "dm", ...dmMsg.toObject() };
      for (const [ws, username] of clients.entries()) {
        if (username === dmMsg.from || username === dmMsg.to) {
          if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msgObj));
        }
      }
    }
  });

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();
