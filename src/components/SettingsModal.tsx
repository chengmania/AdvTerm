// AdvTerm — settings modal
// Author: chengmania KC3SMW

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore, useTabStore, getAllProfiles } from '../store';
import { PROFILES, type ProfileDef } from '../profiles';
import { TERM_THEMES, FONT_FAMILIES } from '../themes';

interface Props {
  onClose: () => void;
}

interface ToolStatus {
  installed: boolean;
  authed: boolean;
  installing: boolean;
}

export default function SettingsModal({ onClose }: Props) {
  const {
    sidebarPosition, setSidebarPosition,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    terminalTheme, setTerminalTheme,
    importProfiles,
  } = useSettingsStore();
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);
  const [configMsg, setConfigMsg]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flashMsg = (msg: string) => {
    setSessionMsg(msg);
    setTimeout(() => setSessionMsg(null), 2500);
  };

  const flashConfig = (msg: string) => {
    setConfigMsg(msg);
    setTimeout(() => setConfigMsg(null), 2500);
  };

  const handleExport = () => {
    const all = Object.values(getAllProfiles());
    const json = JSON.stringify(all, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'advterm-profiles.json';
    a.click();
    URL.revokeObjectURL(url);
    flashConfig('Exported!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
        const valid = parsed.filter(
          (p: unknown) => p && typeof p === 'object' && 'id' in (p as object) && 'name' in (p as object) && 'launchCommand' in (p as object)
        ) as ProfileDef[];
        importProfiles(valid);
        flashConfig(`Imported ${valid.length} profile${valid.length !== 1 ? 's' : ''}`);
      } catch {
        flashConfig('Import failed: invalid JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const [toolStatus, setToolStatus] = useState<Record<string, ToolStatus>>({});

  useEffect(() => {
    Object.values(PROFILES).forEach(async p => {
      const installed = await invoke<boolean>('check_command_exists', { name: p.installCommand });
      const authed = p.authFilePath
        ? await invoke<boolean>('check_file_exists', { path: p.authFilePath })
        : true;
      setToolStatus(prev => ({ ...prev, [p.id]: { installed, authed, installing: false } }));
    });
  }, []);

  const handleInstall = async (profileId: string) => {
    const profile = PROFILES[profileId];
    if (!profile?.installable) return;

    // Mark as installing
    setToolStatus(prev => ({ ...prev, [profileId]: { ...prev[profileId], installing: true } }));

    // Open a new terminal tab named "Install: <tool>" and run the install command
    const tabId = await useTabStore.getState().addTab(`Install: ${profile.name}`);
    onClose();

    // Give the PTY a moment to initialize before writing
    setTimeout(() => {
      invoke('pty_write', { tabId, data: profile.installScript + '\r' }).catch(console.error);
      window.dispatchEvent(new CustomEvent('advterm:focus-terminal'));
    }, 600);
  };

  const [showAvailable, setShowAvailable] = useState(false);

  const statusLabel = (s?: ToolStatus) => {
    if (!s) return { text: '…', color: '#555' };
    if (!s.authed) return { text: 'Not logged in', color: '#e0a050' };
    return { text: 'Ready', color: '#4caf50' };
  };

  const allProfiles = Object.values(PROFILES);
  const installedProfiles = allProfiles.filter(p => toolStatus[p.id]?.installed);
  const notInstalledProfiles = allProfiles.filter(p => toolStatus[p.id] && !toolStatus[p.id].installed);

  const renderInstalledCard = (p: ProfileDef) => {
    const s = toolStatus[p.id];
    const { text, color } = statusLabel(s);
    return (
      <div
        key={p.id}
        style={{ background: '#252525', border: '1px solid #2a3a2a', borderRadius: '6px', padding: '10px 12px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#ddd' }}>{p.name}</span>
          <span style={{ fontSize: '11px', color, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {text}
          </span>
        </div>
        {s && !s.authed && (
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#888' }}>
            Run <code style={{ color: '#7eb8f7', background: '#1a1a1a', padding: '1px 4px', borderRadius: '3px' }}>{p.launchCommand}</code> in a tab to log in
          </div>
        )}
      </div>
    );
  };

  const renderInstallCard = (p: ProfileDef) => {
    const s = toolStatus[p.id];
    const isInstalling = s?.installing ?? false;
    return (
      <div
        key={p.id}
        style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '6px', padding: '10px 12px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#999' }}>{p.name}</span>
        </div>
        <button
          onClick={() => handleInstall(p.id)}
          disabled={isInstalling}
          style={{
            width: '100%', padding: '6px', borderRadius: '4px',
            cursor: isInstalling ? 'default' : 'pointer',
            background: isInstalling ? '#222' : '#1a2a3a',
            border: `1px solid ${isInstalling ? '#333' : '#3a6a9a'}`,
            color: isInstalling ? '#666' : '#7eb8f7',
            fontSize: '12px', fontWeight: 600,
          }}
        >
          {isInstalling ? 'Opening installer…' : `Install ${p.name}`}
        </button>
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '24px', width: '400px', color: '#ccc', maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#e0e0e0' }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {/* Sidebar position */}
        <section style={{ marginBottom: '24px' }}>
          <div style={sectionLabel}>Sidebar Position</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['left', 'right'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => setSidebarPosition(pos)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '5px', cursor: 'pointer',
                  background: sidebarPosition === pos ? '#2a3a4a' : '#252525',
                  border: sidebarPosition === pos ? '1px solid #4a7aa0' : '1px solid #333',
                  color: sidebarPosition === pos ? '#7eb8f7' : '#888',
                  fontSize: '13px', textTransform: 'capitalize',
                }}
              >{pos}</button>
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid #2a2a2a', marginBottom: '24px' }} />

        {/* Session */}
        <section style={{ marginBottom: '24px' }}>
          <div style={sectionLabel}>Session</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={async () => {
                await useTabStore.getState().saveSession();
                flashMsg('Session saved');
              }}
              style={sessionBtn}
            >Save Session</button>
            <button
              onClick={async () => {
                await useTabStore.getState().restoreSession();
                flashMsg('Session restored');
              }}
              style={sessionBtn}
            >Restore Session</button>
            {sessionMsg && (
              <span style={{ fontSize: '11px', color: '#7bc47e' }}>{sessionMsg}</span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '7px' }}>
            Save stores open tabs &amp; profiles. Restored automatically on next launch.
          </div>
        </section>

        <div style={{ borderTop: '1px solid #2a2a2a', marginBottom: '24px' }} />

        {/* Config import / export */}
        <section style={{ marginBottom: '24px' }}>
          <div style={sectionLabel}>Profile Config</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleExport} style={sessionBtn}>Export Profiles</button>
            <button onClick={() => fileInputRef.current?.click()} style={sessionBtn}>Import Profiles</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            {configMsg && <span style={{ fontSize: '11px', color: '#7bc47e' }}>{configMsg}</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '7px' }}>
            Export saves all profiles to JSON. Import merges profiles from a JSON file.
          </div>
        </section>

        <div style={{ borderTop: '1px solid #2a2a2a', marginBottom: '24px' }} />

        {/* Terminal appearance */}
        <section style={{ marginBottom: '24px' }}>
          <div style={sectionLabel}>Terminal Appearance</div>

          {/* Font size */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#aaa' }}>Font Size</span>
              <span style={{ fontSize: '12px', color: '#7eb8f7', fontWeight: 600 }}>{fontSize}px</span>
            </div>
            <input
              type="range" min={10} max={22} step={1} value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4a7aa0' }}
            />
          </div>

          {/* Font family */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>Font Family</div>
            <select
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
              style={{
                width: '100%', background: '#252525', border: '1px solid #333',
                borderRadius: '4px', color: '#ccc', padding: '6px 8px', fontSize: '12px',
              }}
            >
              {FONT_FAMILIES.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Terminal theme */}
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>Color Theme</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {TERM_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTerminalTheme(t.id)}
                  title={t.name}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  }}
                >
                  <div style={{
                    width: '36px', height: '24px', borderRadius: '4px',
                    background: t.preview,
                    border: terminalTheme === t.id ? '2px solid #7eb8f7' : '2px solid #333',
                  }} />
                  <span style={{ fontSize: '10px', color: terminalTheme === t.id ? '#7eb8f7' : '#666', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div style={{ borderTop: '1px solid #2a2a2a', marginBottom: '24px' }} />

        {/* AI Tools — installed */}
        <section>
          <div style={sectionLabel}>AI Tools</div>
          {installedProfiles.length === 0 && (
            <div style={{ color: '#555', fontSize: '12px', padding: '8px 0' }}>
              No AI tools detected yet…
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {installedProfiles.map(p => renderInstalledCard(p))}
          </div>
        </section>

        {/* Install more tools — collapsible */}
        {notInstalledProfiles.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid #2a2a2a', margin: '20px 0 16px' }} />
            <section>
              <button
                onClick={() => setShowAvailable(v => !v)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  marginBottom: showAvailable ? '10px' : 0,
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Available to Install ({notInstalledProfiles.length})
                </span>
                <span style={{ color: '#666', fontSize: '14px' }}>{showAvailable ? '▲' : '▼'}</span>
              </button>
              {showAvailable && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notInstalledProfiles.map(p => renderInstallCard(p))}
                </div>
              )}
            </section>
          </>
        )}

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 16px', background: '#2a3a4a', border: '1px solid #4a7aa0', borderRadius: '4px', color: '#7eb8f7', cursor: 'pointer', fontSize: '13px' }}
          >Done</button>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#888',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
};

const sessionBtn: React.CSSProperties = {
  padding: '6px 14px', background: '#252525', border: '1px solid #3a3a3a',
  borderRadius: '4px', color: '#ccc', cursor: 'pointer', fontSize: '12px',
};
