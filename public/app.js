const ws = new WebSocket("wss://droplet-production-aaaf.up.railway.app");

let myUsername = "";
let replyToMsg = null;
let currentChatUser = null; // null = group, otherwise username

// ======= THEME TOGGLE =======
const toggleBtn = document.getElementById("themeToggle");
toggleBtn.onclick = () => {
  if(document.body.classList.contains("light")){
    document.body.classList.replace("light","dark");
    toggleBtn.innerHTML='<i class="bi bi-sun-fill"></i>';
  } else {
    document.body.classList.replace("dark","light");
    toggleBtn.innerHTML='<i class="bi bi-moon-fill"></i>';
  }
};

// ======= WEBSOCKET =======
ws.onmessage = (event)=>{
  const data = JSON.parse(event.data);

  switch(data.type){
    case "welcome":
      myUsername = data.username;
      document.getElementById("username").innerText = myUsername;
      break;

    case "chat":
      if(currentChatUser===null) addMessage(data.username,data.message,data.replyTo,data.time,data.fileType,data.fileData,data.reactions||{});
      break;

    case "dm":
      // Only show if DM matches current chat
      if(currentChatUser===data.from || currentChatUser===data.to){
        addDMMessage(data);
      }
      break;

    case "reaction-update":
      updateReactions(data.time,data.reactions);
      break;

    case "users":
      updateUsersDropdown(data.users);
      break;
  }
};

// ======= USERS DROPDOWN =======
function updateUsersDropdown(users){
  const usersList = document.getElementById("usersList");
  usersList.innerHTML="";
  users.forEach(user=>{
    const li=document.createElement("li");
    li.textContent=user;
    li.className="dropdown-item";
    li.onclick=()=>startPrivateChat(user);
    usersList.appendChild(li);
  });
}

// ======= START PRIVATE CHAT =======
function startPrivateChat(user){
  currentChatUser = user;
  document.getElementById("messages").innerHTML="";
  document.getElementById("reply-preview").classList.add("d-none");
}

// ======= SEND MESSAGE =======
const msgInput=document.getElementById("msgInput");
const sendBtn=document.getElementById("sendBtn");
sendBtn.onclick=sendMsg;
msgInput.addEventListener("keypress",e=>{if(e.key==="Enter")sendMsg();});

function sendMsg(){
  const msg=msgInput.value.trim();
  if(!msg) return;

  if(currentChatUser){
    ws.send(JSON.stringify({ type:"dm", to: currentChatUser, message: msg }));
  } else {
    ws.send(JSON.stringify({ type:"chat", message: msg, replyTo: replyToMsg }));
  }
  msgInput.value="";
  replyToMsg=null;
  document.getElementById("reply-preview").classList.add("d-none");
}

// ======= ADD GROUP MESSAGE =======
function addMessage(name,text,replyTo=null,time=Date.now(),fileType=null,fileData=null,reactions={}){
  const container=document.getElementById("messages");
  const div=document.createElement("div");
  div.classList.add("msg");
  div.dataset.time=time;

  let replyHtml=replyTo?`<div class="reply-preview">Replying to: ${replyTo}</div>`:"";
  let contentHtml="";
  if(fileType && fileData && fileType.startsWith("image/")) contentHtml=`<img src="${fileData}" alt="image">`;
  else contentHtml=name===myUsername?text:`<span class="name">${name}</span>${text}`;

  div.innerHTML=replyHtml+contentHtml;

  // Reply button
  const replyBtn=document.createElement("span");
  replyBtn.textContent="Reply";
  replyBtn.classList.add("reply-btn");
  replyBtn.onclick=()=>startReply(div,name,text);
  div.appendChild(replyBtn);

  // Reactions
  const reactionsDiv=document.createElement("div");
  reactionsDiv.classList.add("reactions");
  const emojis=["👍","❤️","😂","😮","😢","👎"];
  emojis.forEach(emoji=>{
    const count=Object.values(reactions).filter(v=>v===emoji).length;
    const span=document.createElement("span");
    span.textContent=count>0?`${emoji} ${count}`:emoji;
    span.classList.add("reaction");
    span.onclick=()=>reactToMessage(div,emoji);
    reactionsDiv.appendChild(span);
  });
  div.appendChild(reactionsDiv);

  div.classList.add(name===myUsername?"me":"other");
  container.appendChild(div);
  container.scrollTop=container.scrollHeight;
}

// ======= ADD DM MESSAGE =======
function addDMMessage(data){
  const container=document.getElementById("messages");
  const div=document.createElement("div");
  div.classList.add("msg");
  div.innerHTML=`<span class="name">${data.from} → ${data.to}</span>: ${data.message}`;
  div.classList.add(data.from===myUsername?"me":"other");
  container.appendChild(div);
  container.scrollTop=container.scrollHeight;
}

// ======= REPLY =======
const replyPreview=document.getElementById("reply-preview");
const replyText=document.getElementById("reply-text");

function startReply(msgDiv,name,text){
  replyToMsg=text;
  replyPreview.classList.remove("d-none");
  replyText.textContent=`${name}: ${text}`;
  msgInput.focus();
}

document.getElementById("cancel-reply").onclick=()=>{
  replyToMsg=null;
  replyPreview.classList.add("d-none");
  replyText.textContent="";
}

// ======= REACTIONS =======
function reactToMessage(msgDiv,emoji){
  const time=msgDiv.dataset.time;
  ws.send(JSON.stringify({ type:"reaction", time, emoji }));
}

function updateReactions(time,reactions){
  const msgDiv=Array.from(document.querySelectorAll(".msg")).find(m=>m.dataset.time==time);
  if(!msgDiv) return;
  const reactionsDiv=msgDiv.querySelector(".reactions");
  const emojis=["👍","❤️","😂","😮","😢","👎"];
  reactionsDiv.innerHTML="";
  emojis.forEach(emoji=>{
    const count=Object.values(reactions).filter(v=>v===emoji).length;
    const span=document.createElement("span");
    span.textContent=count>0?`${emoji} ${count}`:emoji;
    span.classList.add("reaction");
    span.onclick=()=>reactToMessage(msgDiv,emoji);
    reactionsDiv.appendChild(span);
  });
}
