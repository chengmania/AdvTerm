// AdvTerm — terminal color themes
// Author: chengmania KC3SMW

import type { ITheme } from '@xterm/xterm';

export interface TermThemeDef {
  id: string;
  name: string;
  preview: string;  // background color for the swatch
  crtEffect?: boolean;
  snowEffect?: boolean;
  xterm: ITheme;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const TERM_THEMES: TermThemeDef[] = [
  {
    id: 'dark',
    name: 'Dark',
    preview: '#1a1a1a',
    xterm: {
      background: '#1a1a1a',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      selectionBackground: '#264f78',
      black: '#000000', brightBlack: '#555555',
      red: '#cd3131',   brightRed: '#f14c4c',
      green: '#0dbc79', brightGreen: '#23d18b',
      yellow: '#e5e510', brightYellow: '#f5f543',
      blue: '#2472c8',  brightBlue: '#3b8eea',
      magenta: '#bc3fbc', brightMagenta: '#d670d6',
      cyan: '#11a8cd',  brightCyan: '#29b8db',
      white: '#e5e5e5', brightWhite: '#ffffff',
    },
  },
  {
    id: 'light',
    name: 'Light',
    preview: '#f5f5f5',
    xterm: {
      background: '#f5f5f5',
      foreground: '#333333',
      cursor: '#333333',
      selectionBackground: '#add6ff',
      black: '#000000', brightBlack: '#666666',
      red: '#cd3131',   brightRed: '#cd3131',
      green: '#00bc00', brightGreen: '#00bc00',
      yellow: '#949800', brightYellow: '#b5b800',
      blue: '#0451a5',  brightBlue: '#0451a5',
      magenta: '#bc05bc', brightMagenta: '#bc05bc',
      cyan: '#0598bc',  brightCyan: '#0598bc',
      white: '#555555', brightWhite: '#888888',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    preview: '#282a36',
    xterm: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#f8f8f2',
      selectionBackground: '#44475a',
      black: '#21222c', brightBlack: '#6272a4',
      red: '#ff5555',   brightRed: '#ff6e6e',
      green: '#50fa7b', brightGreen: '#69ff94',
      yellow: '#f1fa8c', brightYellow: '#ffffa5',
      blue: '#bd93f9',  brightBlue: '#d6acff',
      magenta: '#ff79c6', brightMagenta: '#ff92df',
      cyan: '#8be9fd',  brightCyan: '#a4ffff',
      white: '#f8f8f2', brightWhite: '#ffffff',
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    preview: '#002b36',
    xterm: {
      background: '#002b36',
      foreground: '#839496',
      cursor: '#839496',
      selectionBackground: '#073642',
      black: '#073642', brightBlack: '#002b36',
      red: '#dc322f',   brightRed: '#cb4b16',
      green: '#859900', brightGreen: '#586e75',
      yellow: '#b58900', brightYellow: '#657b83',
      blue: '#268bd2',  brightBlue: '#839496',
      magenta: '#d33682', brightMagenta: '#6c71c4',
      cyan: '#2aa198',  brightCyan: '#93a1a1',
      white: '#eee8d5', brightWhite: '#fdf6e3',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai',
    preview: '#272822',
    xterm: {
      background: '#272822',
      foreground: '#f8f8f2',
      cursor: '#f8f8f0',
      selectionBackground: '#49483e',
      black: '#272822', brightBlack: '#75715e',
      red: '#f92672',   brightRed: '#f92672',
      green: '#a6e22e', brightGreen: '#a6e22e',
      yellow: '#f4bf75', brightYellow: '#f4bf75',
      blue: '#66d9e8',  brightBlue: '#66d9e8',
      magenta: '#ae81ff', brightMagenta: '#ae81ff',
      cyan: '#a1efe4',  brightCyan: '#a1efe4',
      white: '#f8f8f2', brightWhite: '#f9f8f5',
    },
  },
  {
    id: 'crt',
    name: 'Retro CRT',
    preview: '#0a0a0a',
    crtEffect: true,
    xterm: {
      background: '#0a0a0a',
      foreground: '#00ff41',
      cursor: '#00ff41',
      cursorAccent: '#0a0a0a',
      selectionBackground: '#00ff4133',
      black: '#0a0a0a',    brightBlack: '#1a2a1a',
      red: '#ff0000',      brightRed: '#ff4444',
      green: '#00ff41',    brightGreen: '#44ff77',
      yellow: '#ffff00',   brightYellow: '#ffff66',
      blue: '#0088ff',     brightBlue: '#44aaff',
      magenta: '#ff00ff',  brightMagenta: '#ff66ff',
      cyan: '#00ffff',     brightCyan: '#66ffff',
      white: '#00ff41',    brightWhite: '#aaffaa',
    },
  },
  {
    id: 'futurist',
    name: 'Futurist',
    preview: '#050d1a',
    snowEffect: true,
    xterm: {
      background: '#050d1a',
      foreground: '#00e5ff',
      cursor: '#00e5ff',
      cursorAccent: '#050d1a',
      selectionBackground: '#00e5ff33',
      black: '#050d1a',      brightBlack: '#1a2a3a',
      red: '#ff4466',        brightRed: '#ff6688',
      green: '#00ff88',      brightGreen: '#44ffaa',
      yellow: '#ffee44',     brightYellow: '#ffff88',
      blue: '#4488ff',       brightBlue: '#88aaff',
      magenta: '#dd44ff',    brightMagenta: '#ee88ff',
      cyan: '#00e5ff',       brightCyan: '#88eeff',
      white: '#aaccdd',      brightWhite: '#ffffff',
    },
  },
];

export const FONT_FAMILIES = [
  { id: 'monospace',          name: 'System Default' },
  { id: "'Courier New', monospace", name: 'Courier New' },
  { id: "'Ubuntu Mono', monospace", name: 'Ubuntu Mono' },
  { id: "'Fira Code', monospace",   name: 'Fira Code' },
  { id: "'JetBrains Mono', monospace", name: 'JetBrains Mono' },
  { id: "'Cascadia Code', monospace",  name: 'Cascadia Code' },
  { id: "'VT323', monospace",          name: 'VT323 (Retro)' },
];

export function getTheme(id: string): TermThemeDef {
  return TERM_THEMES.find(t => t.id === id) ?? TERM_THEMES[0];
}
