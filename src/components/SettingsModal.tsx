// AdvTerm — settings modal
// Author: chengmania KC3SMW

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../store';
import { PROFILES } from '../profiles';

interface Props {
  onClose: () => void;
}

interface ToolStatus {
  installed: boolean;
  authed: boolean;
  copied: boolean;
}

export default function SettingsModal({ onClose }: Props) {
  const { sidebarPosition, setSidebarPosition } = useSettingsStore();
  const [toolStatus, setToolStatus] = useState<Record<string, ToolStatus>>({});

  useEffect(() => {
    Object.values(PROFILES).forEach(async p => {
      const installed = await invoke<boolean>('check_command_exists', { name: p.installCommand });
      const authed = p.authFilePath
        ? await invoke<boolean>('check_file_exists', { path: p.authFilePath })
        : true;
      setToolStatus(prev => ({ ...prev, [p.id]: { installed, authed, copied: false } }));
    });
  }, []);

  const copyInstall = (profileId: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setToolStatus(prev => ({ ...prev, [profileId]: { ...prev[profileId], copied: true } }));
    setTimeout(() => setToolStatus(prev => ({ ...prev, [profileId]: { ...prev[profileId], copied: false } })), 2000);
  };

  const label = (s?: { label: string; color: string }) => s;
  const statusLabel = (s?: ToolStatus) => {
    if (!s) return { text: '…', color: '#555' };
    if (!s.installed) return { text: 'Not installed', color: '#e05252' };
    if (!s.authed) return { text: 'Not logged in', color: '#e0a050' };
    return { text: 'Ready', color: '#4caf50' };
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '24px', width: '380px', color: '#ccc', maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#e0e0e0' }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {/* Sidebar position */}
        <section style={{ marginBottom: '24px' }}>
          <div style={sectionLabel}>Sidebar Position</div>
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
              >{pos}</button>
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid #2a2a2a', marginBottom: '24px' }} />

        {/* AI Tools */}
        <section>
          <div style={sectionLabel}>AI Tools</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.values(PROFILES).map(p => {
              const s = toolStatus[p.id];
              const { text, color } = statusLabel(s);
              return (
                <div key={p.id} style={{ background: '#252525', border: '1px solid #2e2e2e', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: s && !s.installed ? '10px' : 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#ddd' }}>{p.name}</span>
                    <span style={{ fontSize: '11px', color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                      {text}
                    </span>
                  </div>

                  {s && !s.installed && (
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '6px 8px', color: '#aaa', marginBottom: '6px', wordBreak: 'break-all' }}>
                        {p.installInstructions}
                      </div>
                      <button
                        onClick={() => copyInstall(p.id, p.installInstructions)}
                        style={{ width: '100%', padding: '5px', background: s.copied ? '#2a4a2a' : '#222', border: `1px solid ${s.copied ? '#3a6a3a' : '#333'}`, borderRadius: '4px', color: s.copied ? '#7bc47e' : '#888', cursor: 'pointer', fontSize: '11px' }}
                      >
                        {s.copied ? '✓ Copied!' : 'Copy install command'}
                      </button>
                    </div>
                  )}

                  {s?.installed && !s.authed && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#888' }}>
                      Run <code style={{ color: '#7eb8f7', background: '#1a1a1a', padding: '1px 4px', borderRadius: '3px' }}>{p.launchCommand}</code> in a tab to log in
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 16px', background: '#2a3a4a', border: '1px solid #4a7aa0', borderRadius: '4px', color: '#7eb8f7', cursor: 'pointer', fontSize: '13px' }}
          >Done</button>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#888',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
};
