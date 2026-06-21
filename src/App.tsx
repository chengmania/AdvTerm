// AdvTerm — main view
// Author: chengmania KC3SMW

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';
import './App.css';
import { useTabStore, useSettingsStore } from './store';
import { PROFILES } from './profiles';
import { getTheme, hexToRgba } from './themes';
import { termBridge } from './terminalBridge';
import SnowCanvas from './components/SnowCanvas';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import SearchBar from './components/SearchBar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function notifyTab(tabTitle: string) {
  sendNotification({ title: 'AdvTerm — task finished', body: tabTitle });
}

// ── Welcome banner ────────────────────────────────────────────────────────────

const CYAN  = '\x1b[96m';
const RESET = '\x1b[0m';

const WELCOME_BANNER = [
  "",
  " █████╗ ██████╗ ██╗   ██╗    ████████╗███████╗██████╗ ███╗   ███╗",
  "██╔══██╗██╔══██╗██║   ██║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║",
  "███████║██║  ██║██║   ██║       ██║   █████╗  ██████╔╝██╔████╔██║",
  "██╔══██║██║  ██║╚██╗ ██╔╝       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║",
  "██║  ██║██████╔╝ ╚████╔╝        ██║   ███████╗██║  ██║██║ ╚═╝ ██║",
  "╚═╝  ╚═╝╚═════╝   ╚═══╝         ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝",
].map(line => `${CYAN}${line}${RESET}`).join('\r\n') +
  '\r\n' +
  `  A terminal built for AI coding agents — Claude Code, Antigravity, OpenCode, Aider & more.\r\n` +
  `  Slash-command palette  ·  Usage meter  ·  Multi-tab  ·  Profile switching\r\n` +
  `  Press ${CYAN}?${RESET} for keyboard shortcuts or ${CYAN}⚙${RESET} for settings.\r\n` +
  '\r\n';

// ── Input classifier ──────────────────────────────────────────────────────────

type InputType = 'slash' | 'shell' | 'prose' | null;

function classifyInput(line: string, profileId: string): InputType {
  if (!line) return null;
  if (line.startsWith('/')) return 'slash';
  if (line.startsWith('!')) return 'shell';
  if (profileId !== 'shell') return 'prose';
  return null;
}

const INPUT_BADGE: Record<NonNullable<InputType>, { label: string; bg: string; color: string }> = {
  slash: { label: '⚡ Slash Cmd',  bg: '#1a2a3a', color: '#7eb8f7' },
  shell: { label: '⚙ Shell',      bg: '#2a1a00', color: '#e0a050' },
  prose: { label: '✍ Prompt',     bg: '#1a1a2a', color: '#aaaaee' },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface TermInstance {
  term: Terminal;
  fit: FitAddon;
  search: SearchAddon;
  unlisten: UnlistenFn | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab } = useTabStore();
  const { sidebarPosition, fontSize, fontFamily, terminalTheme, terminalOpacity } = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [inputType, setInputType]       = useState<InputType>(null);
  const [ctxMenu, setCtxMenu]           = useState<{ x: number; y: number; hasSel: boolean } | null>(null);

  const instances      = useRef<Map<string, TermInstance>>(new Map());
  const containerRefs  = useRef<Map<string, HTMLDivElement>>(new Map());
  const lineBufferRef  = useRef('');
  // Tracks which background tabs have already triggered a notification this "session"
  // (cleared when user visits the tab, so they get one notification per new burst)
  const notifiedRef      = useRef<Set<string>>(new Set());
  // Right-click copy: capture selection on mousedown before xterm clears it
  const savedSelectionRef = useRef<string>('');

  // Stable ref so keyboard handler never goes stale
  const storeRef = useRef({ tabs, activeTabId, addTab, closeTab, setActiveTab });
  useEffect(() => { storeRef.current = { tabs, activeTabId, addTab, closeTab, setActiveTab }; },
    [tabs, activeTabId, addTab, closeTab, setActiveTab]);

  const settingsRef = useRef({ fontSize, fontFamily, terminalTheme, terminalOpacity });
  useEffect(() => { settingsRef.current = { fontSize, fontFamily, terminalTheme, terminalOpacity }; },
    [fontSize, fontFamily, terminalTheme, terminalOpacity]);

  // Reset input classifier + notification state when active tab changes
  useEffect(() => {
    lineBufferRef.current = '';
    setInputType(null);
    if (activeTabId) notifiedRef.current.delete(activeTabId);
  }, [activeTabId]);

  // On first launch: restore saved session, or open a fresh shell tab
  useEffect(() => {
    useTabStore.getState().restoreSession().then(restored => {
      if (!restored) addTab();
    });
  }, []);

  // Create terminal instances for new tabs
  useEffect(() => {
    for (const tab of tabs) {
      if (instances.current.has(tab.id)) continue;

      const { fontSize, fontFamily, terminalTheme, terminalOpacity } = settingsRef.current;
      const theme = getTheme(terminalTheme);
      const bgColor = theme.xterm.background ?? '#1a1a1a';
      const xtermTheme = { ...theme.xterm, background: hexToRgba(bgColor, terminalOpacity) };

      const term   = new Terminal({ cursorBlink: true, fontSize, fontFamily, theme: xtermTheme, allowTransparency: true, rightClickSelectsWord: false });
      const fit    = new FitAddon();
      const search = new SearchAddon();
      term.loadAddon(fit);
      term.loadAddon(search);

      // Keyboard shortcuts — intercept before xterm sends to PTY
      term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if (e.type !== 'keydown') return true;
        if (e.ctrlKey && e.shiftKey) {
          if (e.key === 'C') {
            e.preventDefault();
            const sel = term.getSelection() || window.getSelection()?.toString() || '';
            if (sel) navigator.clipboard.writeText(sel).catch(console.error);
            return false;
          }
          if (e.key === 'V') {
            e.preventDefault();
            const aid = storeRef.current.activeTabId;
            navigator.clipboard.readText().then(text => {
              if (text && aid) invoke('pty_write', { tabId: aid, data: text }).catch(console.error);
            }).catch(console.error);
            return false;
          }
        }
        if (e.ctrlKey) {
          const { tabs: t, activeTabId: aid, addTab: add, closeTab: close, setActiveTab: setActive } = storeRef.current;
          if (e.key === 't') { e.preventDefault(); add(); return false; }
          if (e.key === 'w') { e.preventDefault(); if (aid) close(aid); return false; }
          if (e.key === 'f') { e.preventDefault(); setSearchOpen(true); return false; }
          if (e.key === 'Tab') {
            e.preventDefault();
            if (t.length < 2) return false;
            const idx = t.findIndex(x => x.id === aid);
            const next = e.shiftKey ? t[(idx - 1 + t.length) % t.length] : t[(idx + 1) % t.length];
            setActive(next.id);
            return false;
          }
          if (/^[1-9]$/.test(e.key)) {
            const target = t[parseInt(e.key, 10) - 1];
            if (target) { e.preventDefault(); setActive(target.id); return false; }
          }
        }
        return true;
      });

      const instance: TermInstance = { term, fit, search, unlisten: null };
      instances.current.set(tab.id, instance);

      const container = containerRefs.current.get(tab.id);
      if (container) {
        term.open(container); fit.fit(); term.focus();
        // Keep a ref of the last non-empty selection so right-click copy works
        // even after xterm clears the visual selection on mousedown.
        term.onSelectionChange(() => {
          const s = term.getSelection() || window.getSelection()?.toString() || '';
          if (s) savedSelectionRef.current = s;
        });
        // pointerdown fires before mousedown — capture here before xterm's handler
        // calls removeAllRanges() when mouse-reporting mode (Claude) is active.
        container.addEventListener('pointerdown', (e) => {
          if (e.button === 2) {
            const sel = term.getSelection() || window.getSelection()?.toString() || '';
            if (sel) savedSelectionRef.current = sel;
          } else {
            savedSelectionRef.current = '';
          }
        }, true);
      }

      listen<string>(`pty-data-${tab.id}`, ev => {
        term.write(ev.payload);

        // Background tab activity: badge + OS notification
        const aid = storeRef.current.activeTabId;
        if (tab.id !== aid) {
          useTabStore.getState().markUnread(tab.id);
          if (!document.hasFocus() && !notifiedRef.current.has(tab.id)) {
            notifiedRef.current.add(tab.id);
            const tabTitle = storeRef.current.tabs.find(t => t.id === tab.id)?.title ?? 'Background tab';
            isPermissionGranted().then(granted => {
              if (!granted) requestPermission().then(p => { if (p === 'granted') notifyTab(tabTitle); });
              else notifyTab(tabTitle);
            });
          }
        }
      }).then(fn => { instance.unlisten = fn; });

      // Input classifier: track typed line, update badge
      term.onData(data => {
        invoke('pty_write', { tabId: tab.id, data });

        const aid = storeRef.current.activeTabId;
        if (tab.id !== aid) return;
        const profileId = storeRef.current.tabs.find(t => t.id === aid)?.profile ?? 'shell';

        if (data === '\r' || data === '\n' || data === '\x03') {
          lineBufferRef.current = '';
          setInputType(null);
        } else if (data === '\x7f') {
          lineBufferRef.current = lineBufferRef.current.slice(0, -1);
          setInputType(classifyInput(lineBufferRef.current, profileId));
        } else if (data.length === 1 && data >= ' ') {
          lineBufferRef.current += data;
          setInputType(classifyInput(lineBufferRef.current, profileId));
        }
      });

      // Welcome banner + nudge shell to draw its prompt
      setTimeout(() => {
        term.write(WELCOME_BANNER);
        invoke('pty_write', { tabId: tab.id, data: '\r' }).catch(() => {});
      }, 150);
    }

    instances.current.forEach((inst, id) => {
      if (tabs.find(t => t.id === id)) return;
      inst.unlisten?.();
      inst.term.dispose();
      containerRefs.current.delete(id);
      instances.current.delete(id);
    });
  }, [tabs]);

  // Apply font/theme/opacity changes to all existing terminals live
  useEffect(() => {
    const theme = getTheme(terminalTheme);
    const bgColor = theme.xterm.background ?? '#1a1a1a';
    const xtermTheme = { ...theme.xterm, background: hexToRgba(bgColor, terminalOpacity) };
    instances.current.forEach(({ term, fit }) => {
      term.options.fontSize = fontSize;
      term.options.fontFamily = fontFamily;
      term.options.theme = xtermTheme;
      fit.fit();
    });
  }, [fontSize, fontFamily, terminalTheme, terminalOpacity]);

  useEffect(() => {
    if (!activeTabId) return;
    const inst = instances.current.get(activeTabId);
    if (inst) setTimeout(() => { inst.fit.fit(); inst.term.focus(); }, 10);

    // Update terminal bridge
    termBridge.copyLastBlock = () => {
      const i = instances.current.get(activeTabId ?? '');
      if (!i) return '';
      const buf = i.term.buffer.active;
      const lines: string[] = [];
      for (let n = 0; n < buf.length; n++) {
        const line = buf.getLine(n);
        lines.push(line ? line.translateToString(true) : '');
      }
      const promptRe = /[$%❯>]\s*$/;
      let promptIdx = -1;
      for (let n = lines.length - 1; n >= 0; n--) {
        if (promptRe.test(lines[n].trimEnd())) { promptIdx = n; break; }
      }
      const start = promptIdx >= 0 ? promptIdx + 1 : Math.max(0, lines.length - 60);
      return lines.slice(start).join('\n').trimEnd();
    };

    termBridge.copyVisible = () => {
      const i = instances.current.get(activeTabId ?? '');
      if (!i) return '';
      const buf = i.term.buffer.active;
      const lines: string[] = [];
      const start = Math.max(0, buf.viewportY);
      for (let n = start; n < start + i.term.rows; n++) {
        const line = buf.getLine(n);
        lines.push(line ? line.translateToString(true) : '');
      }
      return lines.join('\n').trimEnd();
    };

    termBridge.pasteText = (text: string) => {
      if (activeTabId) invoke('pty_write', { tabId: activeTabId, data: text }).catch(console.error);
    };
  }, [activeTabId]);

  useEffect(() => {
    const focusActive = () => instances.current.get(activeTabId ?? '')?.term.focus();
    window.addEventListener('advterm:focus-terminal', focusActive);
    return () => window.removeEventListener('advterm:focus-terminal', focusActive);
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
    if (inst && !inst.term.element) {
      inst.term.open(el); inst.fit.fit(); inst.term.focus();
      inst.term.onSelectionChange(() => {
        const s = inst.term.getSelection() || window.getSelection()?.toString() || '';
        if (s) savedSelectionRef.current = s;
      });
      el.addEventListener('pointerdown', (e) => {
        if (e.button === 2) {
          const sel = inst.term.getSelection() || window.getSelection()?.toString() || '';
          if (sel) savedSelectionRef.current = sel;
        } else {
          savedSelectionRef.current = '';
        }
      }, true);
    }
  };

  // Dismiss context menu on any click outside it
  useEffect(() => {
    if (!ctxMenu) return;
    const dismiss = () => setCtxMenu(null);
    window.addEventListener('click', dismiss);
    return () => window.removeEventListener('click', dismiss);
  }, [ctxMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const inst = instances.current.get(activeTabId ?? '');
    const liveSel = inst?.term.getSelection() || window.getSelection()?.toString() || '';
    if (liveSel) savedSelectionRef.current = liveSel;
    setCtxMenu({ x: e.clientX, y: e.clientY, hasSel: savedSelectionRef.current.length > 0 });
  };

  const handleCtxCopy = () => {
    const inst = instances.current.get(activeTabId ?? '');
    const text = inst?.term.getSelection() || window.getSelection()?.toString() || savedSelectionRef.current;
    if (text) navigator.clipboard.writeText(text).catch(console.error);
    savedSelectionRef.current = '';
    setCtxMenu(null);
  };

  const handleCtxPaste = () => {
    navigator.clipboard.readText().then(text => {
      if (text && activeTabId) invoke('pty_write', { tabId: activeTabId, data: text }).catch(console.error);
    }).catch(console.error);
    setCtxMenu(null);
  };

  const handleSearch = (query: string, dir: 'next' | 'prev') => {
    const inst = instances.current.get(activeTabId ?? '');
    if (!inst) return false;
    const opts = { caseSensitive: false, wholeWord: false, regex: false };
    return dir === 'next'
      ? inst.search.findNext(query, opts)
      : inst.search.findPrevious(query, opts);
  };

  const activeTheme = getTheme(terminalTheme);
  const isCRT   = activeTheme.crtEffect;
  const isSnow  = activeTheme.snowEffect;
  const containerClass = isCRT ? 'crt-container' : isSnow ? 'futurist-container' : '';
  const activeProfile = tabs.find(t => t.id === activeTabId)?.profile ?? 'shell';
  const badge = inputType ? INPUT_BADGE[inputType] : null;
  // Only show classifier badge for AI profiles
  const showBadge = badge && PROFILES[activeProfile] !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: `rgba(0,0,0,${terminalOpacity})` }}>
      <TabBar onOpenSettings={() => setSettingsOpen(true)} onOpenHelp={() => setHelpOpen(true)} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarPosition === 'left' && <Sidebar />}
        <div
          className={containerClass}
          style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
          onContextMenu={handleContextMenu}
        >
          {tabs.map(tab => (
            <div
              key={tab.id}
              ref={mountContainer(tab.id)}
              style={{ position: 'absolute', inset: 0, display: tab.id === activeTabId ? 'block' : 'none' }}
            />
          ))}

          {/* Futurist animated snow */}
          {isSnow && <SnowCanvas />}

          {/* Scrollback search bar */}
          {searchOpen && (
            <SearchBar
              onSearch={handleSearch}
              onClose={() => { setSearchOpen(false); instances.current.get(activeTabId ?? '')?.term.focus(); }}
            />
          )}

          {/* Right-click context menu */}
          {ctxMenu && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 1000,
                background: '#252525', border: '1px solid #555', borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)', minWidth: 130, padding: '4px 0',
                fontSize: 13, userSelect: 'none',
              }}
            >
              <div
                onClick={ctxMenu.hasSel ? handleCtxCopy : undefined}
                style={{
                  padding: '6px 16px', cursor: ctxMenu.hasSel ? 'pointer' : 'default',
                  opacity: ctxMenu.hasSel ? 1 : 0.35, color: '#e0e0e0',
                }}
                onMouseEnter={e => { if (ctxMenu.hasSel) (e.target as HTMLElement).style.background = '#3a3a3a'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = ''; }}
              >
                Copy
              </div>
              <div
                onClick={handleCtxPaste}
                style={{ padding: '6px 16px', cursor: 'pointer', color: '#e0e0e0' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = '#3a3a3a'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = ''; }}
              >
                Paste
              </div>
            </div>
          )}

          {/* Input type classifier badge */}
          {showBadge && (
            <div style={{
              position: 'absolute', bottom: '10px', right: '10px', zIndex: 20,
              padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
              background: badge.bg, color: badge.color,
              border: `1px solid ${badge.color}44`,
              pointerEvents: 'none',
            }}>
              {badge.label}
            </div>
          )}
        </div>
        {sidebarPosition === 'right' && <Sidebar />}
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
