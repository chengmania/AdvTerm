// AdvTerm — app state
// Author: chengmania KC3SMW

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

export type Profile = 'shell' | 'claude';

export interface Tab {
  id: string;
  title: string;
  profile: Profile;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (profile?: Profile) => Promise<void>;
  closeTab: (id: string) => Promise<void>;
  setActiveTab: (id: string) => void;
}

let tabCounter = 1;

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: async (profile: Profile = 'shell') => {
    const id = `tab-${Date.now()}`;
    const title = profile === 'claude' ? `Claude ${tabCounter++}` : `Shell ${tabCounter++}`;
    const command = profile === 'claude' ? 'claude' : undefined;
    await invoke('pty_create', { tabId: id, command });
    set(state => ({
      tabs: [...state.tabs, { id, title, profile }],
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

// --- Settings ---

export type SidebarPosition = 'left' | 'right';

interface SettingsStore {
  sidebarPosition: SidebarPosition;
  setSidebarPosition: (pos: SidebarPosition) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      sidebarPosition: 'right',
      setSidebarPosition: (sidebarPosition) => set({ sidebarPosition }),
    }),
    { name: 'advterm-settings' }
  )
);
