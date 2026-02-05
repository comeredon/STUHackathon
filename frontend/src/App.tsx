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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              backdropFilter: 'blur(10px)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            🤖
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 12px 0' }}>STUquestion bot</h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>Initializing authentication...</p>
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
