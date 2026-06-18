// AdvTerm — app state
// Author: chengmania KC3SMW

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { PROFILES, type ProfileDef } from './profiles';

export interface Tab {
  id: string;
  title: string;
  profile: string;  // 'shell' or a profile ID from PROFILES
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  unreadTabs: string[];
  addTab: (title?: string) => Promise<string>;
  closeTab: (id: string) => Promise<void>;
  setActiveTab: (id: string) => void;
  markUnread: (tabId: string) => void;
  activateProfile: (tabId: string, profileId: string) => Promise<void>;
  saveSession: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

let tabCounter = 1;

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  unreadTabs: [],

  addTab: async (title?: string) => {
    const id = `tab-${Date.now()}`;
    const resolvedTitle = title ?? `Shell ${tabCounter++}`;
    await invoke('pty_create', { tabId: id });
    set(state => ({
      tabs: [...state.tabs, { id, title: resolvedTitle, profile: 'shell' }],
      activeTabId: id,
    }));
    return id;
  },

  // Writes the profile's launch command into the existing PTY and upgrades profile
  activateProfile: async (tabId: string, profileId: string) => {
    const profile = PROFILES[profileId];
    if (!profile) return;
    await invoke('pty_write', { tabId, data: profile.launchCommand + '\r' });
    set(state => ({
      tabs: state.tabs.map(t =>
        t.id === tabId
          ? { ...t, profile: profileId, title: `${profile.name} ${tabCounter++}` }
          : t
      ),
    }));
  },

  saveSession: async () => {
    const { tabs } = get();
    const payload = tabs.map(t => ({ title: t.title, profile: t.profile }));
    await invoke('session_save', { tabs: payload });
  },

  restoreSession: async () => {
    const saved = await invoke<{ title: string; profile: string }[]>('session_load');
    if (!saved || saved.length === 0) return false;
    for (const t of saved) {
      const id = await get().addTab(t.title);
      if (t.profile !== 'shell') {
        const profile = (await import('./profiles')).PROFILES[t.profile];
        if (profile) await invoke('pty_write', { tabId: id, data: profile.launchCommand + '\r' });
        set(state => ({
          tabs: state.tabs.map(tab =>
            tab.id === id ? { ...tab, profile: t.profile } : tab
          ),
        }));
      }
    }
    return true;
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
      return { tabs, activeTabId, unreadTabs: state.unreadTabs.filter(t => t !== id) };
    });
  },

  markUnread: (tabId: string) => set(state => ({
    unreadTabs: state.unreadTabs.includes(tabId) ? state.unreadTabs : [...state.unreadTabs, tabId],
  })),

  setActiveTab: (id: string) => set(state => ({
    activeTabId: id,
    unreadTabs: state.unreadTabs.filter(t => t !== id),
  })),
}));

// ── Settings ──────────────────────────────────────────────────────────────────

export type SidebarPosition = 'left' | 'right';

interface SettingsStore {
  sidebarPosition: SidebarPosition;
  fontSize: number;
  fontFamily: string;
  terminalTheme: string;
  customProfiles: ProfileDef[];
  setSidebarPosition: (pos: SidebarPosition) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setTerminalTheme: (theme: string) => void;
  importProfiles: (profiles: ProfileDef[]) => void;
  removeCustomProfile: (id: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      sidebarPosition: 'right',
      fontSize: 14,
      fontFamily: 'monospace',
      terminalTheme: 'dark',
      customProfiles: [],
      setSidebarPosition: (sidebarPosition) => set({ sidebarPosition }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setTerminalTheme: (terminalTheme) => set({ terminalTheme }),
      importProfiles: (incoming) => set(state => {
        const existing = state.customProfiles.filter(
          p => !incoming.find(i => i.id === p.id)
        );
        return { customProfiles: [...existing, ...incoming] };
      }),
      removeCustomProfile: (id) => set(state => ({
        customProfiles: state.customProfiles.filter(p => p.id !== id),
      })),
    }),
    { name: 'advterm-settings' }
  )
);

// Merged view of built-in + user-imported profiles
export function getAllProfiles(): Record<string, ProfileDef> {
  const custom = useSettingsStore.getState().customProfiles;
  const extra: Record<string, ProfileDef> = {};
  for (const p of custom) extra[p.id] = p;
  return { ...PROFILES, ...extra };
}
