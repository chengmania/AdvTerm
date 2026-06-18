// AdvTerm — help & about modal
// Author: chengmania KC3SMW

import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { openUrl } from '@tauri-apps/plugin-opener';

interface Props {
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Ctrl', 'T'],              desc: 'New tab' },
  { keys: ['Ctrl', 'W'],              desc: 'Close current tab' },
  { keys: ['Ctrl', 'Tab'],            desc: 'Next tab' },
  { keys: ['Ctrl', 'Shift', 'Tab'],   desc: 'Previous tab' },
  { keys: ['Ctrl', '1–9'],            desc: 'Jump to tab by number' },
  { keys: ['Ctrl', 'F'],              desc: 'Search scrollback' },
];

const RELEASES_URL = 'https://github.com/chengmania/AdvTerm/releases';
const RELEASES_API = 'https://api.github.com/repos/chengmania/AdvTerm/releases/latest';

type UpdateState = 'idle' | 'checking' | 'up-to-date' | 'available' | 'error';

export default function HelpModal({ onClose }: Props) {
  const [version, setVersion]       = useState<string>('…');
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [latestVer, setLatestVer]   = useState<string>('');

  useEffect(() => { getVersion().then(v => setVersion(v)).catch(() => setVersion('0.1.0')); }, []);

  const checkUpdates = async () => {
    setUpdateState('checking');
    try {
      const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github.v3+json' } });
      if (res.status === 404) { setUpdateState('up-to-date'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { tag_name: string };
      const latest = data.tag_name.replace(/^v/, '');
      const current = version.replace(/^v/, '');
      if (latest === current || latest <= current) {
        setUpdateState('up-to-date');
      } else {
        setLatestVer(latest);
        setUpdateState('available');
      }
    } catch {
      setUpdateState('error');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '24px', width: '380px', color: '#ccc' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#e0e0e0' }}>Help & About</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {/* Keyboard shortcuts */}
        <div style={sectionLabel}>Keyboard Shortcuts</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <tbody>
            {shortcuts.map(({ keys, desc }) => (
              <tr key={desc} style={{ borderBottom: '1px solid #252525' }}>
                <td style={{ padding: '7px 0', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {keys.map((k, i) => (
                      <span key={i} style={{
                        display: 'inline-block', background: '#2a2a2a', border: '1px solid #444',
                        borderRadius: '4px', padding: '2px 7px', fontSize: '11px',
                        color: '#c0c0c0', fontFamily: 'monospace',
                      }}>{k}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '7px 0 7px 12px', fontSize: '12px', color: '#aaa' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid #2a2a2a', marginBottom: '20px' }} />

        {/* About */}
        <div style={sectionLabel}>About</div>
        <div style={{ fontSize: '12px', lineHeight: '1.8', color: '#999' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e0e0e0', marginBottom: '6px' }}>AdvTerm</div>
          <div>A terminal emulator built for AI coding agents.</div>
          <div style={{ marginTop: '8px', color: '#666' }}>
            Claude Code · Antigravity · OpenCode · Codex · Aider · Plandex · Goose
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ color: '#555' }}>Author: </span>
            <span style={{ color: '#7eb8f7' }}>chengmania KC3SMW</span>
          </div>
          <div>
            <span style={{ color: '#555' }}>Stack: </span>
            <span>Tauri · React · xterm.js · Zustand</span>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#555' }}>Version: </span>
            <span style={{ color: '#7eb8f7', fontWeight: 600 }}>{version}</span>
            <button
              onClick={checkUpdates}
              disabled={updateState === 'checking'}
              style={{
                background: 'none', border: '1px solid #333', borderRadius: '4px',
                color: '#666', cursor: updateState === 'checking' ? 'default' : 'pointer',
                fontSize: '11px', padding: '2px 8px',
              }}
            >
              {updateState === 'checking' ? 'Checking…' : 'Check for updates'}
            </button>
          </div>
          {updateState === 'up-to-date' && (
            <div style={{ fontSize: '11px', color: '#4caf50', marginTop: '4px' }}>You're up to date.</div>
          )}
          {updateState === 'available' && (
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              <span style={{ color: '#f0c060' }}>v{latestVer} available — </span>
              <span
                onClick={() => openUrl(RELEASES_URL)}
                style={{ color: '#7eb8f7', cursor: 'pointer', textDecoration: 'underline' }}
              >open releases page</span>
            </div>
          )}
          {updateState === 'error' && (
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Could not reach update server.</div>
          )}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 16px', background: '#2a3a4a', border: '1px solid #4a7aa0', borderRadius: '4px', color: '#7eb8f7', cursor: 'pointer', fontSize: '13px' }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#888',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
};
