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
    const types = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png":"image/png", ".ico":"image/x-icon" };
    res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
    res.end(data);
  });
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Random username generator
function generateName() {
  const colors = ["Red","Green","Blue","Yellow","Purple","Aqua"];
  const animals = ["Fox","Bear","Wolf","Panda","Eagle","Hawk"];
  return colors[Math.floor(Math.random()*colors.length)] +
         animals[Math.floor(Math.random()*animals.length)] +
         "-" + Math.floor(Math.random()*9999);
}

// Users and messages
const users = new Map(); // ws => username
const messages = []; // group messages
const privateMessages = new Map(); // key=username1|username2 => array of messages

function broadcastUsers() {
  const userList = Array.from(users.values());
  const payload = JSON.stringify({ type:"users", users:userList });
  wss.clients.forEach(client => {
    if(client.readyState===WebSocket.OPEN) client.send(payload);
  });
}

// Helper to get private chat key (sorted usernames)
function getDMKey(userA, userB) {
  return [userA, userB].sort().join("|");
}

wss.on("connection", ws => {
  const username = generateName();
  users.set(ws, username);

  ws.send(JSON.stringify({ type:"welcome", username }));

  // Send previous group messages
  messages.forEach(msg => ws.send(JSON.stringify(msg)));

  // Send previous private messages for each pair
  privateMessages.forEach((msgs, key) => {
    const [userA, userB] = key.split("|");
    if(userA === username || userB === username){
      msgs.forEach(m => ws.send(JSON.stringify(m)));
    }
  });

  broadcastUsers();

  ws.on("message", msg => {
    let data;
    try { data = JSON.parse(msg.toString()); } catch { return; }

    // ====== Private DM ======
    if(data.type==="dm" && data.to) {
      const recipientEntry = [...users.entries()].find(([sock,u])=>u===data.to);
      if(!recipientEntry) return; // recipient offline

      const payload = {
        type:"dm",
        from: username,
        to: data.to,
        message: data.message,
        replyTo: data.replyTo||null,
        time: Date.now(),
        fileType: data.fileType||null,
        fileData: data.fileData||null
      };

      // Store in map
      const key = getDMKey(username, data.to);
      if(!privateMessages.has(key)) privateMessages.set(key, []);
      privateMessages.get(key).push(payload);

      // Send only to sender and recipient
      [ws, recipientEntry[0]].forEach(client => {
        if(client.readyState===WebSocket.OPEN) client.send(JSON.stringify(payload));
      });
      return;
    }

    // ====== Group chat ======
    if(data.type==="chat") {
      const payload = {
        type:"chat",
        username,
        message:data.message||"",
        replyTo:data.replyTo||null,
        time:Date.now(),
        fileType:data.fileType||null,
        fileData:data.fileData||null,
        reactions:{} // per-user reactions
      };
      messages.push(payload);
      wss.clients.forEach(client => {
        if(client.readyState===WebSocket.OPEN) client.send(JSON.stringify(payload));
      });
      return;
    }

    // ====== Reaction ======
    if(data.type==="reaction") {
      const target = messages.find(m=>m.time==data.time);
      if(target){
        target.reactions[username] = data.emoji;
        const payload = { type:"reaction-update", time: target.time, reactions: target.reactions };
        wss.clients.forEach(client => {
          if(client.readyState===WebSocket.OPEN) client.send(JSON.stringify(payload));
        });
      }
    }
  });

  ws.on("close", ()=>{
    users.delete(ws);
    broadcastUsers();
  });
});

server.listen(3000,"0.0.0.0",()=>console.log("Chat server running on http://0.0.0.0:3000"));
