import { useEffect, useRef } from 'react';

const getEntryClass = (line) => {
  if (line.startsWith('---')) return 'log-turn';
  if (line.startsWith('▶')) return 'log-player';
  if (line.startsWith('◀')) return 'log-enemy';
  if (line.includes('🎉') || line.includes('💀') || line.includes('🤝')) return 'log-system';
  return '';
};

export default function BattleLog({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="battle-log">
      {entries.length === 0 && (
        <p style={{ color: 'var(--text2)', fontSize: '0.8rem', textAlign: 'center', marginTop: 8 }}>
          バトルログがここに表示されます
        </p>
      )}
      {entries.map((line, i) => (
        <div key={i} className={`log-entry ${getEntryClass(line)}`}>
          {line}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
