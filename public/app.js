// ======= WebSocket Setup =======
const ws = new WebSocket("ws://localhost:3000"); // change to your server if deployed

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
      addMessage(data.username, data.message, data.replyTo, data.time, data.fileType, data.fileData, data.reactions || {});
      break;

    case "reaction":
      updateReaction(data.time, data.emoji);
      break;

    case "users":
      updateUsersDropdown(data.users);
      break;
  }
};

// ======= UPDATE ONLINE USERS DROPDOWN =======
function updateUsersDropdown(users) {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    li.className = "dropdown-item";
    usersList.appendChild(li);
  });
}

// ======= ADD MESSAGE TO CHAT =======
function addMessage(name, text, replyTo = null, time = Date.now(), fileType = null, fileData = null, reactions = {}) {
  const container = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("msg");
  div.dataset.time = time;

  let replyHtml = "";
  if (replyTo) replyHtml = `<div class="reply-preview">Replying to: ${replyTo}</div>`;

  let contentHtml = "";
  if (fileType && fileData) {
    if (fileType.startsWith("image/")) {
      contentHtml = `<img src="${fileData}" alt="image">`;
    }
  } else {
    contentHtml = name === myUsername ? text : `<span class="name">${name}</span>${text}`;
  }

  div.innerHTML = replyHtml + contentHtml;

  // Add reply button
  const replyBtn = document.createElement("span");
  replyBtn.textContent = "Reply";
  replyBtn.classList.add("reply-btn");
  replyBtn.onclick = () => startReply(div, name, text);
  div.appendChild(replyBtn);

  // Add reactions container
  const reactionsDiv = document.createElement("div");
  reactionsDiv.classList.add("reactions");
  const defaultEmojis = ["👍", "❤️", "😂", "😮", "😢", "👎"];

  defaultEmojis.forEach(emoji => {
    const span = document.createElement("span");
    const count = reactions[emoji] || 0;
    span.textContent = count > 0 ? `${emoji} ${count}` : emoji;
    span.classList.add("reaction");
    span.dataset.count = count;
    span.onclick = () => reactToMessage(div, emoji);
    reactionsDiv.appendChild(span);
  });

  div.appendChild(reactionsDiv);

  div.classList.add(name === myUsername ? "me" : "other");
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ======= REPLY FUNCTIONALITY =======
const replyPreview = document.getElementById("reply-preview");
const replyText = document.getElementById("reply-text");
const cancelReplyBtn = document.getElementById("cancel-reply");
const msgInput = document.getElementById("msgInput");

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

// ======= FILE UPLOAD =======
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");

attachBtn.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    ws.send(JSON.stringify({
      message: "",
      replyTo: replyToMsg,
      fileType: file.type,
      fileData: reader.result
    }));
    replyToMsg = null;
    replyPreview.classList.add("d-none");
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
};

// ======= SEND MESSAGE =======
const sendBtn = document.getElementById("sendBtn");
sendBtn.onclick = sendMsg;
msgInput.addEventListener("keypress", e => {
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

// ======= REACTIONS =======
function reactToMessage(msgDiv, emoji) {
  // Update locally
  const reactions = msgDiv.querySelectorAll(".reaction");
  reactions.forEach(r => {
    if (r.textContent.startsWith(emoji)) {
      let count = parseInt(r.dataset.count || "0") + 1;
      r.dataset.count = count;
      r.textContent = `${emoji} ${count}`;
    }
  });

  // Send to server
  const time = msgDiv.dataset.time;
  ws.send(JSON.stringify({ type: "reaction", time, emoji }));
}

function updateReaction(time, emoji) {
  const msgDiv = Array.from(document.querySelectorAll(".msg")).find(m => m.dataset.time == time);
  if (!msgDiv) return;

  const reactions = msgDiv.querySelectorAll(".reaction");
  reactions.forEach(r => {
    if (r.textContent.startsWith(emoji)) {
      let count = parseInt(r.dataset.count || "0") + 1;
      r.dataset.count = count;
      r.textContent = `${emoji} ${count}`;
    }
  });
}
