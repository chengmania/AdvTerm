// AdvTerm — main view
// Author: chengmania KC3SMW

import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTabStore } from './store';
import TabBar from './components/TabBar';

interface TermInstance {
  term: Terminal;
  fit: FitAddon;
  unlisten: UnlistenFn | null;
}

export default function App() {
  const { tabs, activeTabId, addTab } = useTabStore();
  const instances = useRef<Map<string, TermInstance>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Open first tab on mount
  useEffect(() => { addTab(); }, []);

  // Create/destroy terminal instances as tabs are added or removed
  useEffect(() => {
    // Create instances for new tabs
    for (const tab of tabs) {
      if (instances.current.has(tab.id)) continue;

      const term = new Terminal({ cursorBlink: true, theme: { background: '#000000' } });
      const fit = new FitAddon();
      term.loadAddon(fit);

      const instance: TermInstance = { term, fit, unlisten: null };
      instances.current.set(tab.id, instance);

      // Attach to container if it already exists in DOM
      const container = containerRefs.current.get(tab.id);
      if (container) {
        term.open(container);
        fit.fit();
      }

      // Wire PTY output → terminal
      listen<string>(`pty-data-${tab.id}`, e => term.write(e.payload))
        .then(fn => { instance.unlisten = fn; });

      // Wire terminal input → PTY
      term.onData(data => invoke('pty_write', { tabId: tab.id, data }));
    }

    // Dispose instances for closed tabs
    instances.current.forEach((inst, id) => {
      if (tabs.find(t => t.id === id)) return;
      inst.unlisten?.();
      inst.term.dispose();
      containerRefs.current.delete(id);
      instances.current.delete(id);
    });
  }, [tabs]);

  // Re-fit when active tab switches (display:block must be set first)
  useEffect(() => {
    if (!activeTabId) return;
    const inst = instances.current.get(activeTabId);
    if (inst) setTimeout(() => inst.fit.fit(), 10);
  }, [activeTabId]);

  // Global resize → fit active terminal + sync PTY size
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

  // Called by React when a tab's container div is mounted
  const mountContainer = (tabId: string) => (el: HTMLDivElement | null) => {
    if (!el) return;
    containerRefs.current.set(tabId, el);
    const inst = instances.current.get(tabId);
    if (inst && !inst.term.element) {
      inst.term.open(el);
      inst.fit.fit();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#000' }}>
      <TabBar />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            ref={mountContainer(tab.id)}
            style={{
              position: 'absolute',
              inset: 0,
              display: tab.id === activeTabId ? 'block' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
