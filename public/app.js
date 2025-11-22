// WebSocket connection
const ws = new WebSocket("wss://droplet-production-aaaf.up.railway.app");

let myUsername = "";
let replyToMsg = null;
let jwtToken = null;

// UI elements
const togglePrivateBtn = document.getElementById("togglePrivateBtn");
const privateChatPanel = document.getElementById("private-chat-panel");
const privateChatsList = document.getElementById("privateChatsList");
const toggleBtn = document.getElementById("themeToggle");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const replyPreview = document.getElementById("reply-preview");
const replyText = document.getElementById("reply-text");

// ======= PRIVATE CHAT PANEL =======
togglePrivateBtn.onclick = () => {
  privateChatPanel.classList.toggle("collapsed");
};

// Map for DM windows
const dmWindows = new Map();

// ======= THEME TOGGLE =======
toggleBtn.onclick = () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    toggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
  } else {
    document.body.classList.replace("dark", "light");
    toggleBtn.innerHTML = '<i class="bi bi-moon-fill"></i>';
  }
};

// ======= JWT AUTH =======
// Fetch token from backend login or session endpoint
async function getToken() {
  // Example: replace with your login/session API
  const response = await fetch("/api/session");
  const data = await response.json();
  return data.token;
}

// ======= WEBSOCKET EVENTS =======
ws.onopen = async () => {
  jwtToken = await getToken();
  ws.send(JSON.stringify({ type: "auth", token: jwtToken }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case "welcome":
      myUsername = data.username;
      document.getElementById("username").innerText = myUsername;
      break;

    case "chat":
      addGroupMessage(data.username, data.message, data.replyTo, data.time, data.fileType, data.fileData, data.reactions || {});
      break;

    case "dm":
      addDMMessage(data);
      break;

    case "reaction-update":
      updateReactions(data.time, data.reactions);
      break;

    case "users":
      updateUsersDropdown(data.users);
      break;
  }
};

// ======= USERS DROPDOWN =======
function updateUsersDropdown(users) {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    li.className = "dropdown-item";
    li.onclick = () => openDMWindow(user);
    usersList.appendChild(li);
  });
}

// ======= OPEN DM WINDOW =======
function openDMWindow(user) {
  if (user === myUsername) return;
  if (dmWindows.has(user)) return;

  const container = privateChatsList;
  const dmDiv = document.createElement("div");
  dmDiv.classList.add("dm-window");

  const header = document.createElement("div");
  header.classList.add("dm-header");
  header.textContent = user;

  const messagesDiv = document.createElement("div");
  messagesDiv.classList.add("dm-messages");

  const inputDiv = document.createElement("div");
  inputDiv.classList.add("p-1");
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type a message...";
  input.classList.add("form-control", "form-control-sm");
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendDM(user, input);
  });

  inputDiv.appendChild(input);
  dmDiv.appendChild(header);
  dmDiv.appendChild(messagesDiv);
  dmDiv.appendChild(inputDiv);
  container.appendChild(dmDiv);

  dmWindows.set(user, { container: dmDiv, messagesDiv, input });
}

// ======= SEND DM =======
function sendDM(user, input) {
  const msg = input.value.trim();
  if (!msg) return;
  ws.send(JSON.stringify({ type: "dm", to: user, message: msg, token: jwtToken }));
  input.value = "";
}

// ======= ADD DM MESSAGE =======
function addDMMessage(data) {
  const user = data.from === myUsername ? data.to : data.from;
  if (!dmWindows.has(user)) openDMWindow(user);

  const { messagesDiv } = dmWindows.get(user);
  const div = document.createElement("div");
  div.classList.add("msg");
  div.innerHTML = `<span class="name">${data.from} → ${data.to}</span>: ${data.message}`;
  div.classList.add(data.from === myUsername ? "me" : "other");
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ======= GROUP CHAT =======
sendBtn.onclick = sendGroupMsg;
msgInput.addEventListener("keypress", e => { if (e.key === "Enter") sendGroupMsg(); });

function sendGroupMsg() {
  const msg = msgInput.value.trim();
  if (!msg) return;
  ws.send(JSON.stringify({ type: "chat", message: msg, replyTo: replyToMsg, token: jwtToken }));
  msgInput.value = "";
  replyToMsg = null;
  replyPreview.classList.add("d-none");
}

// ======= ADD GROUP MESSAGE =======
function addGroupMessage(name, text, replyTo = null, time = Date.now(), fileType = null, fileData = null, reactions = {}) {
  const container = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("msg");
  div.dataset.time = time;

  let replyHtml = replyTo ? `<div class="reply-preview">Replying to: ${replyTo}</div>` : "";
  let contentHtml = "";
  if (fileType && fileData && fileType.startsWith("image/")) contentHtml = `<img src="${fileData}" alt="image">`;
  else contentHtml = name === myUsername ? text : `<span class="name">${name}</span>${text}`;
  div.innerHTML = replyHtml + contentHtml;

  // Reply button
  const replyBtn = document.createElement("span");
  replyBtn.textContent = "Reply";
  replyBtn.classList.add("reply-btn");
  replyBtn.onclick = () => startReply(div, name, text);
  div.appendChild(replyBtn);

  // Reactions
  const reactionsDiv = document.createElement("div");
  reactionsDiv.classList.add("reactions");
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "👎"];
  emojis.forEach(emoji => {
    const count = Object.values(reactions).filter(v => v === emoji).length;
    const span = document.createElement("span");
    span.textContent = count > 0 ? `${emoji} ${count}` : emoji;
    span.classList.add("reaction");
    span.onclick = () => reactToMessage(div, emoji);
    reactionsDiv.appendChild(span);
  });
  div.appendChild(reactionsDiv);

  div.classList.add(name === myUsername ? "me" : "other");
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ======= REPLY =======
function startReply(msgDiv, name, text) {
  replyToMsg = text;
  replyPreview.classList.remove("d-none");
  replyText.textContent = `${name}: ${text}`;
  msgInput.focus();
}

// Cancel reply
document.getElementById("cancel-reply").onclick = () => {
  replyToMsg = null;
  replyPreview.classList.add("d-none");
  replyText.textContent = "";
};

// ======= REACTIONS =======
function reactToMessage(msgDiv, emoji) {
  const time = msgDiv.dataset.time;
  ws.send(JSON.stringify({ type: "reaction", time, emoji, token: jwtToken }));
}

function updateReactions(time, reactions) {
  const msgDiv = Array.from(document.querySelectorAll("#messages .msg")).find(m => m.dataset.time == time);
  if (!msgDiv) return;
  const reactionsDiv = msgDiv.querySelector(".reactions");
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "👎"];
  reactionsDiv.innerHTML = "";
  emojis.forEach(emoji => {
    const count = Object.values(reactions).filter(v => v === emoji).length;
    const span = document.createElement("span");
    span.textContent = count > 0 ? `${emoji} ${count}` : emoji;
    span.classList.add("reaction");
    span.onclick = () => reactToMessage(msgDiv, emoji);
    reactionsDiv.appendChild(span);
  });
}
