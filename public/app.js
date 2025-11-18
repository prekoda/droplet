// ======= Dynamic WebSocket =======
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${window.location.host}`);

let myUsername = "";

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
      addMessage(data.username, data.message);
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

// ======= SEND MESSAGE =======
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("msgInput");

sendBtn.onclick = sendMsg;
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMsg();
});

function sendMsg() {
  if (!msgInput.value.trim()) return;
  ws.send(msgInput.value);
  msgInput.value = "";
  msgInput.focus();
}
