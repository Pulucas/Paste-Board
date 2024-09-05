const config = require('./config.json');
const fs = require("fs");
const http = require('http');
const https = require('https');
const url = require("url");
let currentQuery;
const sessions = {};
const use_HTTPS_server = false; //set this to true if you want to run use https server

const httpServer = http.createServer((req, res) => {
  const host = (req.headers.host.indexOf(":") != -1) ? req.headers.host.slice(0, req.headers.host.indexOf(":")) : req.headers.host;
  if (host !== config.urlHost) {
    fs.promises.readFile(__dirname + "/404/404.html")
    .then((data) => {
      res.setHeader("Content-Type", "text/plain");
      res.writeHead(404);
      res.end(data);
    });
    return;
  }

  const parsedUrl = url.parse(req.url);
  const endpoint = parsedUrl.pathname;
  if ((endpoint === '/board' || endpoint === '/board.html') && parsedUrl.query === null) {
    res.writeHead(302, {'location': '/'});
    res.end();
  } else if ((endpoint === '/board' || endpoint === '/board.html') && parsedUrl.query.slice(0,parsedUrl.query.indexOf("=")) === "id") {
    fs.promises.readFile(__dirname + '/editor/editor.html')
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
    fs.promises.readFile(__dirname + '/homepage/index.html')
    .then((content) => {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(content);
    });
  } else if (endpoint === '/editor.js') {
    fs.promises.readFile(__dirname + '/editor/editor.js')
    .then((content) => {
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end(content);
    });
  } else if (endpoint === '/index.js') {
    fs.promises.readFile(__dirname + "/homepage/index.js")
    .then((content) => {
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end(content);
    })
  } else {
    res.writeHead(302, {'location': '/'});
    res.end();
  }
});

httpServer.listen(config.PORT, config.HOST, () => {
  console.log(`Website up at http://${config.urlHost}:${config.PORT}/`);
});

// Websocket support on same port as server
const WebSocketServer = require("ws").Server;

const wss = new WebSocketServer({ server: httpServer });
console.log(`Websocket Server up at http://${config.HOST}:${config.PORT}/`);

wss.on("connection", (ws) => {
  let timeout;
  const id = currentQuery;
  addSessionToList(ws, id);

  sessions[id].forEach((client) => {
    client.send("Go To This URL On Your Other Devices: http://" + config.urlHost + "/editor?id=" + id);
  });

  timeout = newTimeout(ws);

  ws.onmessage = (data) => {
    const message = data.data;
    // send to all clients connected
    sessions[id].forEach((client) => {
      client.send(message);
    });
    clearTimeout(timeout);
    timeout = newTimeout(ws);
  };

  ws.onclose = () => {
    clearTimeout(timeout);
    removeSessionFromList(ws, id);
  }
});

if (use_HTTPS_server) {
  // Https Server using Let's Encrypt certificates
  const options = {
    key: fs.readFileSync(config.certDir + config.urlHost + "/" + config['ssl-private-key']),
    cert: fs.readFileSync(config.certDir + config.urlHost + "/" + config['ssl-public-cert'])
  }
  const httpsServer = https.createServer(options, (req, res) => {
    const host = (req.headers.host.indexOf(":") != -1) ? req.headers.host.slice(0, req.headers.host.indexOf(":")) : req.headers.host;
    if (host !== config.urlHost) {
      fs.promises.readFile(__dirname + "/404/404.html")
      .then((data) => {
        res.setHeader("Content-Type", "text/plain");
        res.writeHead(404);
        res.end(data);
      });
      return;
    }

    const parsedUrl = url.parse(req.url);
    const endpoint = parsedUrl.pathname;
    if ((endpoint === '/board' || endpoint === '/board.html') && parsedUrl.query === null) {
      res.writeHead(302, {'location': '/'});
      res.end();
    } else if ((endpoint === '/board' || endpoint === '/board.html') && parsedUrl.query.slice(0,parsedUrl.query.indexOf("=")) === "id") {
      fs.promises.readFile(__dirname + '/editor/editor.html')
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
      fs.promises.readFile(__dirname + '/homepage/index.html')
      .then((content) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(content);
      });
    } else if (endpoint === '/editor.js') {
      fs.promises.readFile(__dirname + '/editor/editor.js')
      .then((content) => {
        res.writeHead(200, {'Content-Type': 'text/javascript'});
        res.end(content);
      });
    } else if (endpoint === '/index.js') {
      fs.promises.readFile(__dirname + "/homepage/index.js")
      .then((content) => {
        res.writeHead(200, {'Content-Type': 'text/javascript'});
        res.end(content);
      });
    } else if (endpoint === "/favicon.ico") {
      fs.promises.readFile(__dirname + "/speech-bubble.ico")
      .then((content) => {
        res.writeHead(200, {'Content-Type': 'image/x-icon'});
        res.end(content);
      });
    } else {
      res.writeHead(302, {'location': '/'});
      res.end();
    }
  })

  httpsServer.listen(parseInt(config.PORT) + 1, config.HOST, () => {
    console.log(`Website up at https://${config.urlHost}:${parseInt(config.PORT) + 1}/`);
  });

  const wssHttps = new WebSocketServer({ server: httpsServer });
  console.log(`Websocket Server up at https://${config.HOST}:${parseInt(config.PORT) + 1}/`);

  wssHttps.on("connection", (ws) => {
    let timeout;
    const id = currentQuery;
    addSessionToList(ws, id);

    sessions[id].forEach((client) => {
      client.send("Go To This URL On Your Other Devices: https://" + config.urlHost + "/editor?id=" + id);
    });

    timeout = newTimeout(ws);
    ws.onmessage = (data) => {
      const message = data.data;
      // send to all clients connected
      sessions[id].forEach((client) => {
        client.send(message);
      });
      clearTimeout(timeout);
      timeout = newTimeout(ws);
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      removeSessionFromList(ws, id);
    }
  });
}

function newTimeout(ws) {
  return setTimeout(() => {
    ws.close();
  }, eval(config.TIMEOUT));
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