const ws = new WebSocket("ws://localhost:3000");
let myUsername = "";

// THEME TOGGLE
const toggleBtn = document.getElementById("themeToggle");
toggleBtn.onclick = () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    toggleBtn.textContent = "🌙";
  }
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "welcome") {
    myUsername = data.username;
    document.getElementById("username").innerText = myUsername;
    return;
  }

  if (data.type === "chat") {
    addMessage(data.username, data.message);
  }
};

function addMessage(name, text) {
  const container = document.getElementById("messages");

  const div = document.createElement("div");
  div.classList.add("msg");

  if (name === myUsername) {
    div.classList.add("me");
  } else {
    div.classList.add("other");
    div.innerHTML = `<span class="name">${name}</span>`;
  }

  div.innerHTML += text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

document.getElementById("sendBtn").onclick = sendMsg;
document.getElementById("msgInput").addEventListener("keypress", e => {
  if (e.key === "Enter") sendMsg();
});

function sendMsg() {
  const input = document.getElementById("msgInput");
  if (!input.value.trim()) return;
  ws.send(input.value);
  input.value = "";
}
