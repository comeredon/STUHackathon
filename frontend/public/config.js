// Local development config - will be overwritten in Docker container
// In development, authConfig.ts will use import.meta.env instead
window.APP_CONFIG = {
  VITE_AZURE_CLIENT_ID: '',
  VITE_AZURE_AUTHORITY: '',
  VITE_REDIRECT_URI: '',
  VITE_POST_LOGOUT_REDIRECT_URI: '',
  VITE_FUNCTIONS_API_URL: '',
  VITE_FABRIC_AGENT_API_URL: '',
  VITE_API_URL: '',
};
