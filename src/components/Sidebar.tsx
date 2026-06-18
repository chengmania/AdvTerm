// AdvTerm — sidebar (profile-agnostic)
// Author: chengmania KC3SMW

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '../store';
import { PROFILES, type ProfileDef } from '../profiles';
import { termBridge } from '../terminalBridge';
import UsageMeter from './UsageMeter';

export default function Sidebar() {
  const { tabs, activeTabId } = useTabStore();
  const [filter, setFilter] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [hoveredCmd, setHoveredCmd] = useState<{ cmd: string; desc: string } | null>(null);

  // Per-profile install/auth state
  const [profileStatus, setProfileStatus] = useState<Record<string, { installed: boolean; authed: boolean }>>({});

  useEffect(() => {
    Object.values(PROFILES).forEach(async p => {
      const installed = await invoke<boolean>('check_command_exists', { name: p.installCommand });
      const authed = p.authFilePath
        ? await invoke<boolean>('check_file_exists', { path: p.authFilePath })
        : true;
      setProfileStatus(prev => ({ ...prev, [p.id]: { installed, authed } }));
    });
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const profileId = activeTab?.profile;
  const profile: ProfileDef | undefined = profileId ? PROFILES[profileId] : undefined;
  const status = profileId ? profileStatus[profileId] : undefined;

  const copyText = (key: string, getText: () => string) => {
    const text = getText();
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    }).catch(console.error);
  };

  const pasteFromClipboard = () => {
    navigator.clipboard.readText().then(text => {
      if (text && termBridge.pasteText) {
        termBridge.pasteText(text);
        window.dispatchEvent(new CustomEvent('advterm:focus-terminal'));
      }
    }).catch(console.error);
  };

  const sendCommand = (cmd: string) => {
    if (!activeTabId) return;
    invoke('pty_write', { tabId: activeTabId, data: cmd + '\r' }).catch(console.error);
    window.dispatchEvent(new CustomEvent('advterm:focus-terminal'));
  };

  const filtered = (profile?.slashCommands ?? []).filter(c =>
    c.cmd.includes(filter.toLowerCase()) || c.desc.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{
      width: '240px',
      flexShrink: 0,
      background: '#161616',
      borderLeft: '1px solid #2a2a2a',
      borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#ccc',
      fontSize: '12px',
    }}>

      {/* Active profile status banner */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a', background: '#1a1a1a' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          {profile ? profile.name : 'No AI active'}
        </div>

        {!profile && (
          <span style={{ color: '#555', fontSize: '11px' }}>Launch an AI tool in a tab</span>
        )}

        {profile && status && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                background: !status.installed ? '#e05252' : !status.authed ? '#e0a050' : '#4caf50' }} />
              <span style={{ color: !status.installed ? '#c97070' : !status.authed ? '#c9a96e' : '#9dc99e', fontSize: '11px' }}>
                {!status.installed ? 'Not installed' : !status.authed ? 'Not logged in' : 'Authenticated'}
              </span>
            </div>
            {status.installed && !status.authed && (
              <button
                onClick={() => sendCommand('/login')}
                style={{ marginTop: '8px', width: '100%', padding: '4px 0', background: '#2a3a2a', border: '1px solid #3a5a3a', borderRadius: '4px', color: '#7bc47e', cursor: 'pointer', fontSize: '11px' }}
              >Login</button>
            )}
          </>
        )}
      </div>

      {/* Usage meter — only when profile has usage config */}
      {profile?.usage && <UsageMeter config={profile.usage} />}

      {/* Slash-command filter */}
      {profile && (
        <div style={{ padding: '8px', borderBottom: '1px solid #2a2a2a' }}>
          <input
            ref={filterRef}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            onBlur={() => window.dispatchEvent(new CustomEvent('advterm:focus-terminal'))}
            placeholder="Filter commands…"
            style={{
              width: '100%', background: '#222', border: '1px solid #333',
              borderRadius: '4px', padding: '4px 8px', color: '#ccc',
              fontSize: '12px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Clipboard helpers */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #2a2a2a', display: 'flex', gap: '4px' }}>
        <button
          onClick={() => copyText('block', () => termBridge.copyLastBlock?.() ?? '')}
          title="Copy last output block (since last prompt)"
          style={clipBtn(copied === 'block')}
        >{copied === 'block' ? '✓ Copied' : 'Copy block'}</button>
        <button
          onClick={() => copyText('visible', () => termBridge.copyVisible?.() ?? '')}
          title="Copy visible terminal contents"
          style={clipBtn(copied === 'visible')}
        >{copied === 'visible' ? '✓ Copied' : 'Copy view'}</button>
        <button
          onClick={pasteFromClipboard}
          title="Paste clipboard into terminal"
          style={clipBtn(false)}
        >Paste</button>
      </div>

      {/* 2-column slash palette */}
      {profile && (
        <>
          {/* Hover description bar */}
          <div style={{
            padding: '5px 10px', minHeight: '34px',
            borderBottom: '1px solid #1e1e1e',
            background: '#111',
            display: 'flex', alignItems: 'center',
          }}>
            {hoveredCmd ? (
              <span style={{ fontSize: '11px', lineHeight: 1.4 }}>
                <span style={{ color: '#7eb8f7', fontFamily: 'monospace' }}>{hoveredCmd.cmd}</span>
                <span style={{ color: '#666' }}> — </span>
                <span style={{ color: '#999' }}>{hoveredCmd.desc}</span>
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#333' }}>Hover a command for details</span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {filtered.map(c => (
                <button
                  key={c.cmd}
                  onClick={() => sendCommand(c.cmd)}
                  style={{
                    textAlign: 'left', background: '#1a1a1a', border: '1px solid #252525',
                    borderRadius: '4px', padding: '6px 8px', cursor: 'pointer',
                    color: '#7eb8f7', fontFamily: 'monospace', fontSize: '12px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#222'; setHoveredCmd(c); }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; setHoveredCmd(null); }}
                >{c.cmd}</button>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '12px', color: '#555', textAlign: 'center' }}>No matches</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const clipBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '4px 2px', borderRadius: '4px', cursor: 'pointer',
  background: active ? '#2a3a2a' : '#1a1a1a',
  border: `1px solid ${active ? '#3a5a3a' : '#2a2a2a'}`,
  color: active ? '#7bc47e' : '#777',
  fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
});
