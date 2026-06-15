// Production environment.
// In production the app is served by nginx, which reverse-proxies /api to the
// backend container (see nginx/default.conf.template). Using a relative base URL
// means the browser talks to the same origin as the SPA, so no CORS is required.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
