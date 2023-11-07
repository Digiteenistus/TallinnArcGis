import { environment, initializeEnvironment } from "./environments/environment";
import { createServer } from "../server";
import { dataRouter } from "./controllers/data/data.router";
import { scheduledEvents } from "./scheduledEvents";

// import { listen } from "./receiveAzure";
// listen();

initializeEnvironment();

const ASCServer = createServer(app => {
    // Cors options
    app.use((req, res, next) => {
        // Access-Control-Allow-Origin cannot be * when making http requests with withCredentials set to true.
        // widthCredentials need to be true to be able to use cookies!
        res.setHeader('Access-Control-Allow-Origin', environment.pageUrl);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, XSRF-Token');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
        next();
    });
    app.use('/', dataRouter);
    app.use('/api/data', dataRouter);
});

// Activate scheduledEvents
scheduledEvents();

// TODO: export only for production run?
module.exports = ASCServer;
