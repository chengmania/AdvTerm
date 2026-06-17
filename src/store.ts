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
  addTab: () => Promise<void>;
  closeTab: (id: string) => Promise<void>;
  setActiveTab: (id: string) => void;
  activateClaude: (id: string) => Promise<void>;
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
      tabs: [...state.tabs, { id, title, profile: 'shell' as Profile }],
      activeTabId: id,
    }));
  },

  // Launch `claude` inside the existing tab's PTY by sending the command,
  // then mark the tab's profile as 'claude' so the sidebar palette activates.
  activateClaude: async (id: string) => {
    await invoke('pty_write', { tabId: id, data: 'claude\r' });
    set(state => ({
      tabs: state.tabs.map(t =>
        t.id === id ? { ...t, profile: 'claude' as Profile } : t
      ),
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
