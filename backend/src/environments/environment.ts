import {RuntimeInfo} from '../utils/runtime_info';
import * as ProductionEnvironment from './environment.prod';

export const environment = {
  production: false,
  apiUrl:  'http://localhost:3000/api',
  pageUrl: 'http://localhost:4200',
  tokenExpirationSeconds: {
    accessToken: 600,
    refreshToken: 600 * 15
  },
};

export function initializeEnvironment(): void {
  if (!RuntimeInfo.isDevelopmentRun) {
    // swap environment out for production
    const productionEnvironment = ProductionEnvironment.environment as any;
    const devEnvironment = environment as any;

    for (const key of Object.keys(environment)) {
      devEnvironment[key] = productionEnvironment[key];
    }
    console.log(`[PRODUCTION] environment initialized`);
  } else {
    console.log(`[DEVELOPMENT] environment initialized`);
  }
}