export const environment = {
  production: true,
  apiUrl:  'https://tallinnarcgis.azurewebsites.net/api',
  pageUrl: 'https://tallinnarcgis.azurewebsites.net/',
  tokenExpirationSeconds: {
    accessToken: 600,
    refreshToken: 600 * 15
  },
};
