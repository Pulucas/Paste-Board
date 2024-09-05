const HTTPPORT = "1337";
const HTTPSPORT = "1338";
const urlHost = "localhost";
const text = document.getElementById("texta");
const button = document.getElementById("button");
const board = document.getElementById("board");
const connectToInternet = document.getElementById("connectedToInternet");

text.focus();

if (location.protocol === "http:") {
  var ws = new WebSocket(`ws://${urlHost}:${HTTPPORT}`);
} else if (location.protocol === "https:") {
  var ws = new WebSocket(`wss://${urlHost}:${HTTPSPORT}`);
} else {
  console.log("Can't connect to websocket: unknown protocol. Please use http or https.");
}

ws.onopen = () => {
  connectToInternet.innerText = "Connected To Server";
}

ws.onclose = () => {
  connectToInternet.innerText = "Timed Out";
}

ws.onerror = (err) => {
  setTimeout(() => {
    connectToInternet.innerText = "Can't Connect To Server";
  }, 100);
  console.log(err);
}

ws.onmessage = (message) => {
  const p = document.createElement("p");
  p.style = "word-wrap: break-word;"
  p.innerText = message.data;
  p.style.whiteSpace = "pre-line";

  const div = document.createElement("div");
  div.style.backgroundColor = "gray";
  div.style.borderRadius = "15px";
  div.style.display = "inline-block";
  div.style.marginTop = board.hidden == true ? "" : "20px";
  div.style.maxWidth = "94%";
  div.style.paddingLeft = "20px";
  div.style.paddingRight = "20px";
  div.style.paddingTop = "10px";
  div.style.paddingBottom = "10px";
  div.style.width = "auto";
  div.style.display = "inline-block";
  // div.style.marginLeft = "auto";
  // div.style.marginRight = "auto";
  
  div.appendChild(p);

  const button = document.createElement("button");
  button.textContent = "Copy";
  button.style = "width: 100px; height: 30px; border-radius: 10px;";
  button.addEventListener("click", (event) => {
    navigator.clipboard.writeText(p.innerText);
    text.focus();
  });

  div.appendChild(button);

  board.appendChild(div);

  board.hidden = false;
}

text.addEventListener("keydown", event => {
  if (event.key == "Enter" && event.shiftKey) return;
  if (event.key == "Enter") {
    sendData();
    event.preventDefault();
    text.focus()
  }
});

function sendData() {
  ws.send(text.value);
  text.value = "";
  text.focus();
}