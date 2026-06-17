// AdvTerm — tab bar
// Author: chengmania KC3SMW

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '../store';

interface Props {
  onOpenSettings: () => void;
}

export default function TabBar({ onOpenSettings }: Props) {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab } = useTabStore();
  const [claudeInstalled, setClaudeInstalled] = useState(false);

  useEffect(() => {
    invoke<boolean>('check_claude_installed').then(setClaudeInstalled);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#111',
      height: '36px',
      gap: '2px',
      padding: '0 4px',
      flexShrink: 0,
      borderBottom: '1px solid #2a2a2a',
    }}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0 12px', height: '28px',
            background: tab.id === activeTabId ? '#2a2a2a' : 'transparent',
            color: tab.id === activeTabId ? '#e0e0e0' : '#666',
            borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
            userSelect: 'none',
            border: tab.id === activeTabId ? '1px solid #444' : '1px solid transparent',
          }}
        >
          {tab.profile === 'claude' && (
            <span style={{ fontSize: '10px', background: '#2a3a4a', color: '#7eb8f7', borderRadius: '3px', padding: '1px 4px' }}>AI</span>
          )}
          <span>{tab.title}</span>
          <span
            onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
            style={{ opacity: 0.5, fontSize: '15px', lineHeight: 1, marginRight: '-4px' }}
            title="Close tab"
          >×</span>
        </div>
      ))}

      {/* New shell tab */}
      <button
        onClick={() => addTab('shell')}
        title="New shell tab"
        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 6px' }}
      >+</button>

      {/* New Claude tab */}
      <button
        onClick={() => addTab('claude')}
        disabled={!claudeInstalled}
        title={claudeInstalled ? 'New Claude Code tab' : 'Claude Code not installed'}
        style={{
          background: claudeInstalled ? '#1a2a1a' : 'none',
          border: claudeInstalled ? '1px solid #2a4a2a' : '1px solid transparent',
          borderRadius: '4px', color: claudeInstalled ? '#7bc47e' : '#444',
          cursor: claudeInstalled ? 'pointer' : 'not-allowed',
          fontSize: '11px', padding: '3px 8px', marginLeft: '2px',
        }}
      >Claude</button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px', padding: '0 8px' }}
      >⚙</button>
    </div>
  );
}
