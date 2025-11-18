const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

// Serve frontend files
const server = http.createServer((req, res) => {
  let filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "index.html" : req.url
  );

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
      ".js": "application/javascript"
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
  return (
    colors[Math.floor(Math.random() * colors.length)] +
    animals[Math.floor(Math.random() * animals.length)] +
    "-" +
    Math.floor(Math.random() * 9999)
  );
}

// Track connected users
const users = new Map();

function broadcastUsers() {
  const userList = Array.from(users.values());
  const payload = JSON.stringify({ type: "users", users: userList });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  const username = generateName();
  users.set(ws, username);

  // Send welcome
  ws.send(JSON.stringify({ type: "welcome", username }));
  broadcastUsers();

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      console.error("Invalid message format:", msg.toString());
      return;
    }

    const payload = {
      type: "chat",
      username,
      message: data.message,
      replyTo: data.replyTo || null,
      time: Date.now()
    };

    // Broadcast to all users
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    });
  });

  ws.on("close", () => {
    users.delete(ws);
    broadcastUsers();
  });
});

// Start server
server.listen(3000, "0.0.0.0", () => {
  console.log("Chat server running on http://0.0.0.0:3000");
});
