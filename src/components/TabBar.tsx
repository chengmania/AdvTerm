// AdvTerm — tab bar
// Author: chengmania KC3SMW

import { useTabStore } from '../store';

export default function TabBar() {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab } = useTabStore();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#111',
      height: '36px',
      gap: '2px',
      padding: '0 4px',
      flexShrink: 0,
      borderBottom: '1px solid #333',
    }}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 12px',
            height: '28px',
            background: tab.id === activeTabId ? '#2a2a2a' : 'transparent',
            color: tab.id === activeTabId ? '#e0e0e0' : '#666',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            userSelect: 'none',
            border: tab.id === activeTabId ? '1px solid #444' : '1px solid transparent',
          }}
        >
          <span>{tab.title}</span>
          <span
            onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
            style={{ opacity: 0.5, fontSize: '15px', lineHeight: 1, marginRight: '-4px' }}
            title="Close tab"
          >×</span>
        </div>
      ))}
      <button
        onClick={() => addTab()}
        title="New tab"
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '22px',
          lineHeight: 1,
          padding: '0 8px',
          marginLeft: '2px',
        }}
      >+</button>
    </div>
  );
}
