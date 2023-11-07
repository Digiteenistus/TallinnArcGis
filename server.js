const tallinnArcgisServer = require("./_build_/src/app");
const app = tallinnArcgisServer.app;

const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

const onError = error => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

let server;

const onListening = () => {
  const addr = server.address();
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  //debug("Listening on " + bind);
  console.log("server.js listening on " + bind);
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

if (process.env.DEV_HOST_ENABLED === true) {
  app.setHost(process.env.HOST_IP);
} else {

}

if (process.env.DEV_USE_SSL === 'true') {
  const https = require("https");
  const fs = require('fs');
  let key = fs.readFileSync(__dirname + '/backend/cert.key');
  let cert = fs.readFileSync(__dirname + '/backend/cert.crt');
  let options = {
    key: key,
    cert: cert
  };

  server = https.createServer(options, app);

  server.on("error", onError);
  server.on("listening", onListening);
  // ascServer.setupWebsocket(server);
  server.listen(+port);
} else {
  const http = require("http");

  server = http.createServer(app);

  server.on("error", onError);
  server.on("listening", onListening);
  // ascServer.setupWebsocket(server);
  server.listen(+port);
}

