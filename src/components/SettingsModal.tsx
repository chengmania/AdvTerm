// AdvTerm — settings modal
// Author: chengmania KC3SMW

import { useSettingsStore } from '../store';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { sidebarPosition, setSidebarPosition } = useSettingsStore();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px',
          padding: '24px', minWidth: '300px', color: '#ccc',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#e0e0e0' }}>Settings</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >×</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Sidebar Position
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['left', 'right'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => setSidebarPosition(pos)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '5px', cursor: 'pointer',
                  background: sidebarPosition === pos ? '#2a3a4a' : '#252525',
                  border: sidebarPosition === pos ? '1px solid #4a7aa0' : '1px solid #333',
                  color: sidebarPosition === pos ? '#7eb8f7' : '#888',
                  fontSize: '13px', textTransform: 'capitalize',
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 16px', background: '#2a3a4a', border: '1px solid #4a7aa0', borderRadius: '4px', color: '#7eb8f7', cursor: 'pointer', fontSize: '13px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
