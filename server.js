const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

// Serve frontend files
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".png": "image/png",
      ".ico": "image/x-icon"
    };
    res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
    res.end(data);
  });
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Random username generator
function generateName() {
  const colors = ["Red", "Green", "Blue", "Yellow", "Purple", "Aqua"];
  const animals = ["Fox", "Bear", "Wolf", "Panda", "Eagle", "Hawk"];
  return colors[Math.floor(Math.random() * colors.length)] +
         animals[Math.floor(Math.random() * animals.length)] +
         "-" + Math.floor(Math.random() * 9999);
}

// Track users and messages
const users = new Map();
const messages = []; // each message: {username, message, time, fileType, fileData, reactions:{username:emoji}}

function broadcastUsers() {
  const userList = Array.from(users.values());
  const payload = JSON.stringify({ type: "users", users: userList });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

wss.on("connection", ws => {
  const username = generateName();
  users.set(ws, username);

  ws.send(JSON.stringify({ type: "welcome", username }));

  // Send all previous messages to new client
  messages.forEach(msg => ws.send(JSON.stringify(msg)));

  broadcastUsers();

  ws.on("message", msg => {
    let data;
    try { data = JSON.parse(msg.toString()); } catch { return; }

    // Handle reaction
    if (data.type === "reaction") {
      const target = messages.find(m => m.time == data.time);
      if (target) {
        // Replace previous reaction of this user
        target.reactions[username] = data.emoji;

        // Broadcast updated reactions to all clients
        const payload = { type: "reaction-update", time: target.time, reactions: target.reactions };
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(payload));
        });
      }
      return;
    }

    // Normal chat message
    const payload = {
      type: "chat",
      username,
      message: data.message || "",
      replyTo: data.replyTo || null,
      time: Date.now(),
      fileType: data.fileType || null,
      fileData: data.fileData || null,
      reactions: {} // store per-user reactions
    };

    messages.push(payload);

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(payload));
    });
  });

  ws.on("close", () => {
    users.delete(ws);
    broadcastUsers();
  });
});

// Start server
server.listen(3000, "0.0.0.0", () => console.log("Chat server running on http://0.0.0.0:3000"));
