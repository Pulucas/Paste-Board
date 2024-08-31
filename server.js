const http = require('http');
const fs = require("fs").promises;
const url = require("url");
const WebSocket = require('ws');
const port = "1337";
const host = "localhost";
const TIMEOUT = 1000 * 60 * 5;

const sessions = {};
let currentQuery;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  const endpoint = parsedUrl.pathname;
  if ((endpoint === '/board' || endpoint === '/board.html') && parsedUrl.query === null) {
    res.writeHead(302, {'location': '/'});
    res.end();
  } else if ((endpoint === '/board' || endpoint === '/board.html') && parsedUrl.query.slice(0,parsedUrl.query.indexOf("=")) === "id") {
    fs.readFile(__dirname + '/editor/editor.html')
    .then((content) => {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(content);
    });
    if (parsedUrl.query?.slice(0, parsedUrl.query.indexOf("=")) === "id") {
      currentQuery = parsedUrl.query.slice(parsedUrl.query.indexOf("=") + 1);
    } else {
      currentQuery = null;
    }
  } else if (endpoint === '/') {
    fs.readFile(__dirname + '/homepage/index.html')
    .then((content) => {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(content);
    });
  } else if (endpoint === '/editor.js') {
    fs.readFile(__dirname + '/editor/editor.js')
    .then((content) => {
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end(content);
    });
  } else if (endpoint === '/index.js') {
    fs.readFile(__dirname + "/homepage/index.js")
    .then((content) => {
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end(content);
    })
  } else {
    res.writeHead(302, {'location': '/'});
    res.end();
  }
});

server.listen(port, host, () => {
  console.log(`server listening at http://${host}:${port}/`);
});


// Websocket support on same port as server
const WebSocketServer = require("ws").Server;

const wss = new WebSocketServer({ server });

let timeout;
wss.on("connection", (ws) => {
  const id = currentQuery;
  addSessionToList(ws, id);

  newTimeout(ws);

  ws.onmessage = (data) => {
    const message = data.data;
    // send to all clients connected
    sessions[id].forEach((client) => {
      client.send(message);
    });
    clearTimeout(timeout);
    newTimeout(ws);
  };

  ws.onclose = () => {
    clearTimeout(timeout);
    removeSessionFromList(ws, id);
  }
});

function newTimeout(ws) {
  timeout = setTimeout(() => {
    ws.close();
  }, TIMEOUT);
}

function addSessionToList(ws, id) {
  if (id in sessions) {
    sessions[id].push(ws);
  } else {
    sessions[id] = [ws];
  }
}

function removeSessionFromList(ws, id) {
  const index = sessions[id].indexOf(ws);
  sessions[id].splice(index, 1);
}