import https from "https";
import express, { Express } from "express";
import bodyParser from "body-parser";
import path from "path";
import { errorHandler } from "./src/error/error.middleware";
import { RuntimeInfo } from "./src/utils/runtime_info";

interface tallinnArcgisServer {
  app: Express;
}

interface ServerSetup {
  (app: Express): void;
}

function addMiddleware(app: Express) {
  app.use(bodyParser.json({ limit: "5mb" }));
  app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
}

export const createServer = (setup: ServerSetup): tallinnArcgisServer => {
  const app: Express = express();

  addMiddleware(app);

  // let caller set up routes etc
  setup(app);

  // leave error handler as last
  app.use(errorHandler);
  let server: any;

  if (RuntimeInfo.isDevelopmentRun) {
    console.log("Development run!");
    // development run with ts-node-dev. Backend only
    if (process.env.DEV_USE_SSL) {
      startHttpsServer(app).then(() => {
        console.log("Https server listening on port 3000!");
      });
    } else {
      const port = 3000;

      server = require("http").createServer(app);

      server.listen(port, () => {
        console.log(
          `⚡️[server]: Server is running at http://localhost:${port}`
        );
      });
    }
  } else {
    console.log("Production run!");
  }

  return {
    app,
  };

  async function startHttpsServer(app: Express): Promise<void> {
    const privateKey = "test"; // await KeyVault.getPrivateKey();
    const publicKey = "test"; //await KeyVault.getPublicKey();
    const credentials = { key: privateKey, cert: publicKey };
    const server = https.createServer(credentials, app);
    server.listen(3000);
  }
};
