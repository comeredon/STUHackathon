import { BackendMode } from '../types/chat';

interface BackendSelectorProps {
  currentMode: BackendMode;
  onModeChange: (mode: BackendMode) => void;
}

export function BackendSelector({ currentMode, onModeChange }: BackendSelectorProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #edebe9',
        backgroundColor: '#faf9f8',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#323130' }}>
          Backend Mode:
        </span>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <input
            type="radio"
            name="backend"
            value="functions"
            checked={currentMode === 'functions'}
            onChange={() => onModeChange('functions')}
          />
          <span style={{ fontSize: '14px' }}>Azure Functions (GPT-4.1)</span>
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
          title="Fabric Agent requires Azure AI Foundry project setup"
        >
          <input
            type="radio"
            name="backend"
            value="fabric-agent"
            checked={currentMode === 'fabric-agent'}
            onChange={() => onModeChange('fabric-agent')}
            disabled
          />
          <span style={{ fontSize: '14px' }}>Fabric Agent (Not Available)</span>
        </label>
      </div>
      <div style={{ fontSize: '12px', color: '#605e5c' }}>
        ℹ️ Azure Functions backend not yet deployed. Please deploy backend (Step 5) to enable chat functionality.
      </div>
    </div>
  );
}
