// ======= WebSocket Setup =======
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${window.location.host}`);

let myUsername = "";
let replyToMsg = null;

// ======= THEME TOGGLE =======
const toggleBtn = document.getElementById("themeToggle");
toggleBtn.onclick = () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    toggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
  } else {
    document.body.classList.replace("dark", "light");
    toggleBtn.innerHTML = '<i class="bi bi-moon-fill"></i>';
  }
};

// ======= HANDLE WEBSOCKET MESSAGES =======
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "welcome":
      myUsername = data.username;
      document.getElementById("username").innerText = myUsername;
      break;

    case "chat":
      addMessage(data.username, data.message, data.replyTo, data.time);
      break;

    case "users":
      updateUsersDropdown(data.users);
      break;

    default:
      console.warn("Unknown message type:", data.type);
  }
};

// ======= UPDATE ONLINE USERS DROPDOWN =======
function updateUsersDropdown(users) {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    li.className = "dropdown-item";
    usersList.appendChild(li);
  });
}

// ======= ADD MESSAGE TO CHAT =======
function addMessage(name, text, replyTo = null, time = Date.now()) {
  const container = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("msg");
  div.dataset.time = time;

  // Add reply preview if exists
  let replyHtml = "";
  if (replyTo) {
    replyHtml = `<div class="reply-preview">Replying to: ${replyTo}</div>`;
  }

  if (name === myUsername) {
    div.classList.add("me");
    div.innerHTML = replyHtml + text;
  } else {
    div.classList.add("other");
    div.innerHTML = replyHtml + `<span class="name">${name}</span>${text}`;
  }

  // Add reply button
  const replyBtn = document.createElement("span");
  replyBtn.textContent = "Reply";
  replyBtn.classList.add("reply-btn");
  replyBtn.onclick = () => startReply(div, name, text);
  div.appendChild(replyBtn);

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ======= REPLY FUNCTIONALITY =======
const replyPreview = document.getElementById("reply-preview");
const replyText = document.getElementById("reply-text");
const cancelReplyBtn = document.getElementById("cancel-reply");

function startReply(msgDiv, name, text) {
  replyToMsg = text;
  replyPreview.classList.remove("d-none");
  replyText.textContent = `${name}: ${text}`;
  msgInput.focus();
}

cancelReplyBtn.onclick = () => {
  replyToMsg = null;
  replyPreview.classList.add("d-none");
  replyText.textContent = "";
};

// ======= SEND MESSAGE =======
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("msgInput");

sendBtn.onclick = sendMsg;
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMsg();
});

function sendMsg() {
  const msg = msgInput.value.trim();
  if (!msg) return;

  ws.send(JSON.stringify({ message: msg, replyTo: replyToMsg }));
  msgInput.value = "";
  replyToMsg = null;
  replyPreview.classList.add("d-none");
}
