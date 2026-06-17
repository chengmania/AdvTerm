// AdvTerm — usage meter (profile-agnostic)
// Author: chengmania KC3SMW

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { UsageConfig } from '../profiles';

interface UsageEntry {
  pct: number;
  resetsAt: string;
}

interface UsageData {
  session: UsageEntry;
  week: UsageEntry;
}

function parse(text: string, cfg: UsageConfig): UsageData | null {
  const s = text.match(cfg.sessionRegex);
  const w = text.match(cfg.weekRegex);
  if (!s || !w) return null;
  return {
    session: { pct: parseInt(s[1]), resetsAt: s[2].trim() },
    week:    { pct: parseInt(w[1]), resetsAt: w[2].trim() },
  };
}

function barColor(pct: number) {
  if (pct >= 90) return '#e05252';
  if (pct >= 70) return '#e0a050';
  return '#4caf50';
}

function Bar({ label, entry }: { label: string; entry: UsageEntry }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ color: '#999', fontSize: '11px' }}>{label}</span>
        <span style={{ color: barColor(entry.pct), fontSize: '11px', fontWeight: 600 }}>{entry.pct}%</span>
      </div>
      <div style={{ height: '5px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${entry.pct}%`, background: barColor(entry.pct), borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ color: '#555', fontSize: '10px', marginTop: '2px' }}>resets {entry.resetsAt}</div>
    </div>
  );
}

export default function UsageMeter({ config }: { config: UsageConfig }) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await invoke<string>('run_headless', { program: config.program, args: config.args });
      const parsed = parse(text, config);
      if (parsed) setData(parsed);
      else setError('Could not parse usage output');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [config.program]);

  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #2a2a2a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage</div>
        <button
          onClick={refresh}
          disabled={loading}
          title="Refresh usage"
          style={{ background: 'none', border: 'none', color: loading ? '#444' : '#555', cursor: loading ? 'default' : 'pointer', fontSize: '12px', padding: 0 }}
        >{loading ? '…' : '↻'}</button>
      </div>
      {error && <div style={{ color: '#e05252', fontSize: '11px' }}>{error}</div>}
      {data && <><Bar label="Session" entry={data.session} /><Bar label="Week" entry={data.week} /></>}
      {!data && !error && !loading && <div style={{ color: '#555', fontSize: '11px' }}>No data</div>}
    </div>
  );
}
