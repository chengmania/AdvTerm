// AdvTerm — tab state
// Author: chengmania KC3SMW

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface Tab {
  id: string;
  title: string;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: () => Promise<void>;
  closeTab: (id: string) => Promise<void>;
  setActiveTab: (id: string) => void;
}

let tabCounter = 1;

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: async () => {
    const id = `tab-${Date.now()}`;
    const title = `Shell ${tabCounter++}`;
    await invoke('pty_create', { tabId: id });
    set(state => ({
      tabs: [...state.tabs, { id, title }],
      activeTabId: id,
    }));
  },

  closeTab: async (id: string) => {
    await invoke('pty_close', { tabId: id });
    set(state => {
      const tabs = state.tabs.filter(t => t.id !== id);
      let activeTabId = state.activeTabId;
      if (activeTabId === id) {
        const idx = state.tabs.findIndex(t => t.id === id);
        activeTabId = tabs[Math.max(0, idx - 1)]?.id ?? null;
      }
      return { tabs, activeTabId };
    });
  },

  setActiveTab: (id: string) => set({ activeTabId: id }),
}));
