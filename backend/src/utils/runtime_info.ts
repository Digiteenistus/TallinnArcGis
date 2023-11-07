export class RuntimeInfo {
    static isDevelopmentRun: boolean = (process.env.TS_NODE_DEV !== undefined || process.env.NODEMON_DEV !== undefined);
  }
  