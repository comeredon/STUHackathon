import { LogLevel, Configuration } from '@azure/msal-browser';

// Runtime config from window object (injected by docker-entrypoint.sh)
// Falls back to Vite env vars for local development
declare global {
  interface Window {
    APP_CONFIG?: {
      VITE_AZURE_CLIENT_ID: string;
      VITE_AZURE_AUTHORITY: string;
      VITE_REDIRECT_URI: string;
      VITE_POST_LOGOUT_REDIRECT_URI: string;
      VITE_FUNCTIONS_API_URL: string;
      VITE_FABRIC_AGENT_API_URL: string;
    };
  }
}

const getConfig = (key: keyof NonNullable<typeof window.APP_CONFIG>) => {
  // In production (Docker), use runtime config from window.APP_CONFIG
  if (window.APP_CONFIG && window.APP_CONFIG[key]) {
    return window.APP_CONFIG[key];
  }
  // In development, use Vite environment variables
  return import.meta.env[key] || '';
};

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: getConfig('VITE_AZURE_CLIENT_ID'),
    authority: getConfig('VITE_AZURE_AUTHORITY') || 'https://login.microsoftonline.com/common',
    redirectUri: getConfig('VITE_REDIRECT_URI') || 'http://localhost:5173',
    postLogoutRedirectUri: getConfig('VITE_POST_LOGOUT_REDIRECT_URI') || 'http://localhost:5173',
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
      piiLoggingEnabled: false,
    },
  },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: ['User.Read'],
};
