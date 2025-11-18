const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const crypto = require("crypto");

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

// random username generator
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

wss.on("connection", (ws) => {
  const username = generateName();

  ws.send(JSON.stringify({ type: "welcome", username }));

  ws.on("message", (msg) => {
    const payload = JSON.stringify({
      type: "chat",
      username,
      message: msg.toString(),
      time: Date.now()
    });

    // broadcast to all users
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });
});

// Listen publicly
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
