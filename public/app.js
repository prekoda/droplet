const ws = new WebSocket("ws://localhost:3000");
let myUsername = "";

// THEME TOGGLE
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

// WebSocket handling
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

  if (data.type === "users") {
    const usersList = document.getElementById("usersList");
    usersList.innerHTML = "";
    data.users.forEach((u) => {
      const li = document.createElement("li");
      li.textContent = u;
      li.className = "dropdown-item";
      usersList.appendChild(li);
    });
  }
};

// ADD MESSAGE
function addMessage(name, text) {
  const container = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("msg");

  if (name === myUsername) {
    div.classList.add("me");
    div.textContent = text;
  } else {
    div.classList.add("other");
    div.innerHTML = `<span class="name">${name}</span>${text}`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// SEND MESSAGE
document.getElementById("sendBtn").onclick = sendMsg;
document.getElementById("msgInput").addEventListener("keypress", e => {
  if (e.key === "Enter") sendMsg();
});

function sendMsg() {
  const input = document.getElementById("msgInput");
  if (!input.value.trim()) return;
  ws.send(input.value);
  input.value = "";
  input.focus();
}
