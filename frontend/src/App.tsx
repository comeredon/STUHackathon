import { useEffect, useState } from 'react';
import { MsalProvider, MsalAuthenticationTemplate } from '@azure/msal-react';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './auth/authConfig';
import { ChatContainer } from './components/ChatContainer';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize MSAL and handle redirect
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        await msalInstance.handleRedirectPromise();
        setIsInitialized(true);
      } catch (error) {
        console.error('MSAL initialization error:', error);
        setIsInitialized(true); // Set to true anyway to show error state
      }
    };

    initializeMsal();
  }, []);

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f3f2f1',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1>Loading...</h1>
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginRequest}
      >
        <ChatContainer />
      </MsalAuthenticationTemplate>
    </MsalProvider>
  );
}

export default App;
