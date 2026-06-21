// AdvTerm — sidebar (profile-agnostic)
// Author: chengmania KC3SMW

import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore, useSettingsStore } from '../store';
import { PROFILES, type ProfileDef } from '../profiles';
import UsageMeter from './UsageMeter';

interface ClaudeSessionInfo {
  session_id: string;
  project_name: string;
  timestamp: string;
  first_message: string;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function Sidebar() {
  const { tabs, activeTabId, resumeSession } = useTabStore();
  const { sessionRenames, hiddenSessionIds, renameSession, hideSession } = useSettingsStore();
  const [filter, setFilter] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);
  const [hoveredCmd, setHoveredCmd] = useState<{ cmd: string; desc: string } | null>(null);
  const [diskSessions, setDiskSessions] = useState<ClaudeSessionInfo[]>([]);

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

  const loadSessions = useCallback(() => {
    invoke<ClaudeSessionInfo[]>('list_claude_sessions')
      .then(setDiskSessions)
      .catch(console.error);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const profileId = activeTab?.profile;
  const profile: ProfileDef | undefined = profileId ? PROFILES[profileId] : undefined;
  const status = profileId ? profileStatus[profileId] : undefined;

  const sendCommand = (cmd: string) => {
    if (!activeTabId) return;
    invoke('pty_write', { tabId: activeTabId, data: cmd + '\r' }).catch(console.error);
    window.dispatchEvent(new CustomEvent('advterm:focus-terminal'));
  };

  const filtered = (profile?.slashCommands ?? []).filter(c =>
    c.cmd.includes(filter.toLowerCase()) || c.desc.toLowerCase().includes(filter.toLowerCase())
  );

  const visibleSessions = diskSessions.filter(s => !hiddenSessionIds.includes(s.session_id));

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

      {/* Sessions */}
      <div style={{ borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ padding: '6px 12px 4px', fontSize: '10px', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Sessions</span>
          <button onClick={loadSessions} title="Refresh session list" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: '12px', padding: '0 2px', lineHeight: 1 }}>↻</button>
        </div>
        {visibleSessions.length === 0 ? (
          <div style={{ padding: '6px 12px 8px', fontSize: '11px', color: '#333' }}>No sessions yet</div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {visibleSessions.map(s => (
              <SessionRow
                key={s.session_id}
                session={s}
                displayName={sessionRenames[s.session_id] ?? `${s.project_name} · ${fmtDate(s.timestamp)}`}
                onResume={() => resumeSession('claude', s.session_id)}
                onRename={(name) => renameSession(s.session_id, name)}
                onHide={() => hideSession(s.session_id)}
              />
            ))}
          </div>
        )}
      </div>

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

function SessionRow({ session, displayName, onResume, onRename, onHide }: {
  session: ClaudeSessionInfo;
  displayName: string;
  onResume: () => void;
  onRename: (name: string) => void;
  onHide: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== displayName) onRename(trimmed);
    else setDraft(displayName);
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', padding: '4px 8px' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1e1e1e'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraft(displayName); setEditing(false); } }}
            autoFocus
            style={{ width: '100%', background: '#111', border: '1px solid #444', borderRadius: 3, color: '#ccc', fontSize: '11px', padding: '1px 4px', boxSizing: 'border-box' }}
          />
        ) : (
          <div onClick={() => { setDraft(displayName); setEditing(true); }} style={{ cursor: 'text' }}>
            <div style={{ fontSize: '11px', color: '#c0c0c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            {session.first_message && (
              <div style={{ fontSize: '10px', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{session.first_message}</div>
            )}
          </div>
        )}
      </div>
      <button onClick={onResume} title="Resume in new tab" style={iconBtn}>⏎</button>
      <button onClick={onHide} title="Hide from list" style={{ ...iconBtn, color: '#774' }}>×</button>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#666',
  fontSize: '13px', padding: '2px 4px', lineHeight: 1, flexShrink: 0,
};
