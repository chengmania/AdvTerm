// AdvTerm — main view
// Author: chengmania KC3SMW

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTabStore, useSettingsStore } from './store';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';

interface TermInstance {
  term: Terminal;
  fit: FitAddon;
  unlisten: UnlistenFn | null;
}

export default function App() {
  const { tabs, activeTabId, addTab } = useTabStore();
  const { sidebarPosition } = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const instances = useRef<Map<string, TermInstance>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => { addTab(); }, []);

  useEffect(() => {
    for (const tab of tabs) {
      if (instances.current.has(tab.id)) continue;

      const term = new Terminal({ cursorBlink: true, theme: { background: '#000000' } });
      const fit = new FitAddon();
      term.loadAddon(fit);

      const instance: TermInstance = { term, fit, unlisten: null };
      instances.current.set(tab.id, instance);

      const container = containerRefs.current.get(tab.id);
      if (container) { term.open(container); fit.fit(); }

      listen<string>(`pty-data-${tab.id}`, e => term.write(e.payload))
        .then(fn => { instance.unlisten = fn; });

      term.onData(data => invoke('pty_write', { tabId: tab.id, data }));
    }

    instances.current.forEach((inst, id) => {
      if (tabs.find(t => t.id === id)) return;
      inst.unlisten?.();
      inst.term.dispose();
      containerRefs.current.delete(id);
      instances.current.delete(id);
    });
  }, [tabs]);

  useEffect(() => {
    if (!activeTabId) return;
    const inst = instances.current.get(activeTabId);
    if (inst) setTimeout(() => inst.fit.fit(), 10);
  }, [activeTabId]);

  useEffect(() => {
    const onResize = () => {
      if (!activeTabId) return;
      const inst = instances.current.get(activeTabId);
      if (!inst) return;
      inst.fit.fit();
      invoke('pty_resize', { tabId: activeTabId, rows: inst.term.rows, cols: inst.term.cols });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeTabId]);

  const mountContainer = (tabId: string) => (el: HTMLDivElement | null) => {
    if (!el) return;
    containerRefs.current.set(tabId, el);
    const inst = instances.current.get(tabId);
    if (inst && !inst.term.element) { inst.term.open(el); inst.fit.fit(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#000' }}>
      <TabBar onOpenSettings={() => setSettingsOpen(true)} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarPosition === 'left' && <Sidebar />}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              ref={mountContainer(tab.id)}
              style={{ position: 'absolute', inset: 0, display: tab.id === activeTabId ? 'block' : 'none' }}
            />
          ))}
        </div>
        {sidebarPosition === 'right' && <Sidebar />}
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
