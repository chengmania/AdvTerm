// AdvTerm — sidebar (slash-command palette + Claude status)
// Author: chengmania KC3SMW

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '../store';

interface SlashCommand {
  cmd: string;
  desc: string;
}

const CLAUDE_COMMANDS: SlashCommand[] = [
  { cmd: '/help',          desc: 'Show available commands' },
  { cmd: '/clear',         desc: 'Clear conversation history' },
  { cmd: '/compact',       desc: 'Compact conversation to save context' },
  { cmd: '/status',        desc: 'Show account & session status' },
  { cmd: '/usage',         desc: 'Show token usage & limits' },
  { cmd: '/cost',          desc: 'Show session cost' },
  { cmd: '/memory',        desc: 'Manage memory files' },
  { cmd: '/model',         desc: 'Switch AI model' },
  { cmd: '/config',        desc: 'Open configuration' },
  { cmd: '/init',          desc: 'Initialize project CLAUDE.md' },
  { cmd: '/review',        desc: 'Review current diff' },
  { cmd: '/pr-comments',   desc: 'View PR review comments' },
  { cmd: '/permissions',   desc: 'Manage tool permissions' },
  { cmd: '/doctor',        desc: 'Run health checks' },
  { cmd: '/vim',           desc: 'Toggle vim keybindings' },
  { cmd: '/terminal',      desc: 'Open terminal in Claude' },
  { cmd: '/login',         desc: 'Log in to Claude' },
  { cmd: '/logout',        desc: 'Log out of Claude' },
  { cmd: '/exit',          desc: 'Exit Claude Code' },
];

export default function Sidebar() {
  const { tabs, activeTabId } = useTabStore();
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [filter, setFilter] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const isClaudeTab = activeTab?.profile === 'claude';

  useEffect(() => {
    invoke<boolean>('check_claude_installed').then(setInstalled);
    invoke<boolean>('check_claude_auth').then(setAuthed);
  }, []);

  const sendCommand = (cmd: string) => {
    if (!activeTabId) return;
    invoke('pty_write', { tabId: activeTabId, data: cmd });
    filterRef.current?.blur();
  };

  const filtered = CLAUDE_COMMANDS.filter(c =>
    c.cmd.includes(filter.toLowerCase()) || c.desc.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{
      width: '220px',
      flexShrink: 0,
      background: '#161616',
      borderLeft: '1px solid #2a2a2a', borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#ccc',
      fontSize: '12px',
    }}>

      {/* Claude status banner */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a', background: '#1a1a1a' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Claude Code
        </div>
        {installed === null ? (
          <span style={{ color: '#555' }}>Checking…</span>
        ) : !installed ? (
          <div style={{ color: '#e05252' }}>
            Not installed
            <div style={{ color: '#666', marginTop: '4px', fontSize: '11px' }}>
              Run: npm i -g @anthropic-ai/claude-code
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: authed ? '#4caf50' : '#e0a050', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: authed ? '#9dc99e' : '#c9a96e' }}>
              {authed ? 'Authenticated' : 'Not logged in'}
            </span>
          </div>
        )}
        {installed && !authed && (
          <button
            onClick={() => sendCommand('/login')}
            style={{ marginTop: '8px', width: '100%', padding: '4px 0', background: '#2a3a2a', border: '1px solid #3a5a3a', borderRadius: '4px', color: '#7bc47e', cursor: 'pointer', fontSize: '11px' }}
          >
            Login
          </button>
        )}
      </div>

      {/* Slash-command palette */}
      <div style={{ padding: '8px', borderBottom: '1px solid #2a2a2a' }}>
        <input
          ref={filterRef}
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter commands…"
          style={{
            width: '100%',
            background: '#222',
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '4px 8px',
            color: '#ccc',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {!isClaudeTab && (
        <div style={{ padding: '12px', color: '#555', fontSize: '11px', textAlign: 'center' }}>
          Switch to a Claude tab to use the command palette
        </div>
      )}

      {isClaudeTab && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => (
            <button
              key={c.cmd}
              onClick={() => sendCommand(c.cmd)}
              title={c.desc}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #1e1e1e',
                padding: '7px 12px',
                cursor: 'pointer',
                color: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1f1f1f')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ color: '#7eb8f7', fontFamily: 'monospace', display: 'block' }}>{c.cmd}</span>
              <span style={{ color: '#666', fontSize: '11px' }}>{c.desc}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '12px', color: '#555', textAlign: 'center' }}>No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
