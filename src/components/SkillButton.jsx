import { useRef } from 'react';

export default function SkillButton({ skill, selected, disabled, restricted, cooldownLeft, onSelect, onShowDetail }) {
  const timerRef = useRef(null);
  const longPressedRef = useRef(false);

  const startPress = () => {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      onShowDetail?.(skill);
    }, 550);
  };

  const endPress = () => {
    clearTimeout(timerRef.current);
    if (!longPressedRef.current && !disabled) {
      onSelect?.(skill);
    }
  };

  const cancelPress = () => clearTimeout(timerRef.current);

  const bg = disabled || restricted
    ? 'rgba(100,100,130,0.5)'
    : skill.color || '#6366f1';

  return (
    <button
      className={`skill-btn ${selected ? 'selected' : ''}`}
      style={{ background: bg }}
      disabled={disabled && !restricted}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={(e) => { e.preventDefault(); startPress(); }}
      onTouchEnd={(e) => { e.preventDefault(); endPress(); }}
      onTouchMove={cancelPress}
    >
      {cooldownLeft > 0 && (
        <span className="cooldown-badge">CD {cooldownLeft}</span>
      )}
      {restricted && (
        <span className="cooldown-badge" style={{ background: 'rgba(239,68,68,0.8)' }}>封印</span>
      )}
      <span className="skill-name">{skill.name}</span>
      <span className="skill-hint">{skill.hint || ''}</span>
    </button>
  );
}
