import { useEffect, useState } from 'react';
import { MsalProvider, MsalAuthenticationTemplate } from '@azure/msal-react';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './auth/authConfig';
import { ChatContainer, AuthenticatedChatContainer } from './components/ChatContainer';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Check if we're in demo mode (local development without auth)
const isDemoMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const demoMode = isDemoMode();

  useEffect(() => {
    // Skip MSAL initialization in demo mode
    if (demoMode) {
      setIsInitialized(true);
      return;
    }

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
  }, [demoMode]);

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

  // Demo mode: render ChatContainer directly without auth
  if (demoMode) {
    return <ChatContainer demoMode={true} />;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginRequest}
      >
        <AuthenticatedChatContainer />
      </MsalAuthenticationTemplate>
    </MsalProvider>
  );
}

export default App;
