const HTTPPORT = "1337";
const HTTPSPORT = "1338";
const urlHost = window.location.hostname;
const query = window.location.search;
const id = query.split("=")[1].split("&")[0];
const button = document.getElementById("button");
const board = document.getElementById("board");
const connectToInternet = document.getElementById("connectedToInternet");
const text = document.getElementById("texta");

text.focus();

if (window.location.protocol === "http:") {
  var ws = new WebSocket(`ws://${window.location.hostname}:${HTTPPORT}`);
} else if (window.location.protocol === "https:") {
  var ws = new WebSocket(`wss://${window.location.hostname}:${HTTPSPORT}`);
} else {
  console.log("Can't connect to websocket: unknown protocol. Please use http or https.");
}

ws.onopen = () => {
  connectToInternet.innerText = "Connected To Server";

  if (urlHost === "localhost") {
    const message = "Go To This URL On This Device: http://localhost/editor?id=" + id;
    addMessage(message, true);
  } else if (window.location.protocol === "https:") {
    const message = "Go To This URL On Your Other Devices: https://" + window.location.host + "/editor?id=" + id;
    addMessage(message, true);
  } else {
    const message = "Go To This URL On Your Other Devices: http://" + window.location.host + "/editor?id=" + id;
    addMessage(message, true)
  }
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
  addMessage(message.data, false)
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

function addMessage(message, isURLMessage) {
  const p = document.createElement("p");
  p.innerText = message;
  p.style.overflowWrap = "break-word";
  p.style.whiteSpace = "pre-line";

  const div = document.createElement("div");
  div.style.backgroundColor = "gray";
  div.style.borderRadius = "15px";
  div.style.display = "block";
  div.style.marginTop = board.hidden == true ? "" : "20px";
  div.style.maxWidth = "94%";
  div.style.paddingLeft = "20px";
  div.style.paddingRight = "20px";
  div.style.paddingTop = "10px";
  div.style.paddingBottom = "10px";
  div.style.width = "fit-content";
  // div.style.marginLeft = "auto";
  // div.style.marginRight = "auto";
  
  div.appendChild(p);

  if (window.location.hostname === "localhost" || window.location.protocol === "https:") {
    const button = document.createElement("button");
    button.textContent = "Copy";
    button.style = "width: 100px; height: 30px; border-radius: 10px;";
    button.addEventListener("click", (event) => {
      if (isURLMessage) {
        navigator.clipboard.writeText(`${window.location.protocol}//${urlHost}/editor?id=${id}`);
      } else {
        navigator.clipboard.writeText(p.innerText);
      }
      text.focus();
    });

    div.appendChild(button);
  }

  board.appendChild(div);

  board.hidden = false;
}