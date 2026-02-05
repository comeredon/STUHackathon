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
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
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
        <span style={{ fontSize: '14px' }}>Azure Functions (Custom AI)</span>
      </label>
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
          value="fabric-agent"
          checked={currentMode === 'fabric-agent'}
          onChange={() => onModeChange('fabric-agent')}
        />
        <span style={{ fontSize: '14px' }}>Fabric Agent (Native)</span>
      </label>
    </div>
  );
}
