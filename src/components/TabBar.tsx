// AdvTerm — tab bar
// Author: chengmania KC3SMW

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '../store';
import { PROFILES } from '../profiles';

interface Props {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export default function TabBar({ onOpenSettings, onOpenHelp }: Props) {
  const { tabs, activeTabId, unreadTabs, addTab, closeTab, setActiveTab, activateProfile } = useTabStore();
  const [installedProfiles, setInstalledProfiles] = useState<string[]>([]);

  useEffect(() => {
    Promise.all(
      Object.values(PROFILES).map(async p => {
        const ok = await invoke<boolean>('check_command_exists', { name: p.installCommand });
        return ok ? p.id : null;
      })
    ).then(results => setInstalledProfiles(results.filter(Boolean) as string[]));
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeProfile = activeTab?.profile ?? 'shell';

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#111', height: '36px',
      gap: '2px', padding: '0 4px',
      flexShrink: 0, borderBottom: '1px solid #2a2a2a',
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
          {unreadTabs.includes(tab.id) && (
            <span title="Activity in background" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#7eb8f7', display: 'inline-block', flexShrink: 0,
            }} />
          )}
          {tab.profile !== 'shell' && PROFILES[tab.profile] && (
            <span style={{ fontSize: '10px', background: '#2a3a4a', color: '#7eb8f7', borderRadius: '3px', padding: '1px 4px' }}>
              {PROFILES[tab.profile].name.split(' ')[0]}
            </span>
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
        onClick={() => addTab()}
        title="New shell tab"
        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 6px' }}
      >+</button>

      <div style={{ width: '1px', background: '#2a2a2a', height: '18px', margin: '0 4px' }} />

      {/* One button per installed profile */}
      {Object.values(PROFILES).filter(p => installedProfiles.includes(p.id)).map(p => {
        const isActive = activeProfile === p.id;
        return (
          <button
            key={p.id}
            onClick={() => activeTabId && !isActive && activateProfile(activeTabId, p.id)}
            disabled={isActive || !activeTabId}
            title={isActive ? `${p.name} active` : `Launch ${p.name} in current tab`}
            style={{
              background: !isActive ? '#1a2a1a' : 'none',
              border: !isActive ? '1px solid #2a4a2a' : '1px solid transparent',
              borderRadius: '4px',
              color: isActive ? '#444' : '#7bc47e',
              cursor: isActive ? 'default' : 'pointer',
              fontSize: '11px', padding: '3px 8px',
            }}
          >
            {p.name.split(' ')[0]}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <button
        onClick={onOpenHelp}
        title="Help & shortcuts"
        style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '15px', padding: '0 6px' }}
      >?</button>
      <button
        onClick={onOpenSettings}
        title="Settings"
        style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px', padding: '0 8px' }}
      >⚙</button>
    </div>
  );
}
