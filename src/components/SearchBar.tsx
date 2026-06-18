// AdvTerm — in-terminal scrollback search bar
// Author: chengmania KC3SMW

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onSearch: (query: string, direction: 'next' | 'prev') => boolean;
  onClose: () => void;
}

export default function SearchBar({ onSearch, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') { e.preventDefault(); search(e.shiftKey ? 'prev' : 'next'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [query]);

  const search = (dir: 'next' | 'prev') => {
    if (!query) return;
    setFound(onSearch(query, dir));
  };

  const noMatch = found === false && query.length > 0;

  return (
    <div style={{
      position: 'absolute', top: '8px', right: '8px', zIndex: 100,
      display: 'flex', alignItems: 'center', gap: '4px',
      background: '#1e1e1e', border: '1px solid #444',
      borderRadius: '6px', padding: '5px 8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setFound(null); }}
        onKeyDown={e => e.stopPropagation()}
        placeholder="Search…"
        style={{
          background: noMatch ? '#3a1a1a' : '#252525',
          border: `1px solid ${noMatch ? '#7a3a3a' : '#333'}`,
          borderRadius: '4px', padding: '3px 8px',
          color: noMatch ? '#e05252' : '#ccc',
          fontSize: '12px', outline: 'none', width: '180px',
        }}
      />
      <span style={{ fontSize: '11px', color: '#555', minWidth: '56px' }}>
        {noMatch ? 'not found' : ''}
      </span>
      <button onClick={() => search('prev')} title="Previous (Shift+Enter)" style={btnStyle}>↑</button>
      <button onClick={() => search('next')} title="Next (Enter)" style={btnStyle}>↓</button>
      <button onClick={onClose} title="Close (Escape)" style={{ ...btnStyle, color: '#666' }}>×</button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#888',
  cursor: 'pointer', fontSize: '14px', padding: '2px 5px',
};
