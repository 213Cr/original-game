import { useState } from 'react';
import { GC } from '../gameLogic/constants.js';

const STAT_DEFS = [
  { key: 'H', label: 'H', desc: 'HP上昇', detail: '基礎HP100に加算', min: 0 },
  { key: 'A', label: 'A', desc: 'こうげき', detail: 'ダメージ計算に使用', min: GC.MIN_STAT },
  { key: 'B', label: 'B', desc: 'ぼうぎょ', detail: '被ダメを軽減', min: GC.MIN_STAT },
  { key: 'S', label: 'S', desc: 'すばやさ', detail: '先手確率に影響', min: GC.MIN_STAT },
  { key: 'T', label: 'T', desc: 'ぎこう', detail: '特殊技の効果を上昇', min: GC.MIN_STAT },
];

const DEFAULT_ALLOC = { H: 60, A: 15, B: 15, S: 15, T: 15 };

export default function StatSetup({ onDone, initialAlloc }) {
  const [alloc, setAlloc] = useState(initialAlloc || { ...DEFAULT_ALLOC });

  const total = Object.values(alloc).reduce((s, v) => s + v, 0);
  const remaining = GC.DISTRIBUTE_POINTS - total;

  const change = (key, delta) => {
    const def = STAT_DEFS.find(s => s.key === key);
    const newVal = (alloc[key] || 0) + delta;
    if (newVal < def.min) return;
    if (delta > 0 && remaining <= 0) return;
    setAlloc(prev => ({ ...prev, [key]: newVal }));
  };

  const handleSlider = (key, val) => {
    const def = STAT_DEFS.find(s => s.key === key);
    const numVal = parseInt(val, 10);
    if (numVal < def.min) return;
    const delta = numVal - alloc[key];
    if (delta > 0 && delta > remaining) return;
    setAlloc(prev => ({ ...prev, [key]: numVal }));
  };

  const reset = () => setAlloc({ ...DEFAULT_ALLOC });
  const resetAll = () => {
    setAlloc({ H: 0, A: GC.MIN_STAT, B: GC.MIN_STAT, S: GC.MIN_STAT, T: GC.MIN_STAT });
  };

  const displayVal = (key) => {
    if (key === 'H') return `HP: ${GC.BASE_HP + alloc.H}`;
    return alloc[key];
  };

  return (
    <div>
      {/* ポイント残量 */}
      <div className="points-bar">
        <div>
          <div className="points-label">残りポイント</div>
          <div className="points-remaining" style={{ color: remaining === 0 ? 'var(--success)' : 'var(--accent2)' }}>
            {remaining}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="points-label">配分ポイント合計</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
            {total} / {GC.DISTRIBUTE_POINTS}
          </div>
        </div>
      </div>

      {/* ステータス配分 */}
      {STAT_DEFS.map(({ key, label, desc, detail, min }) => (
        <div className="stat-row" key={key}>
          <div className="stat-label">{label}</div>
          <div className="stat-desc">
            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{desc}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text2)' }}>min {min}</div>
          </div>
          <div className="stat-controls">
            <button
              className="stat-btn"
              onClick={() => change(key, -1)}
              disabled={alloc[key] <= min}
            >－</button>

            <span className="stat-val" title={detail}>
              {displayVal(key)}
            </span>

            <button
              className="stat-btn"
              onClick={() => change(key, 1)}
              disabled={remaining <= 0}
            >＋</button>

            <input
              type="range"
              className="stat-slider"
              min={min}
              max={alloc[key] + remaining}
              value={alloc[key]}
              onChange={e => handleSlider(key, e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      ))}

      {/* リセットボタン */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={reset}>
          均等リセット
        </button>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={resetAll}>
          全クリア
        </button>
      </div>

      {/* 確定ボタン */}
      <div style={{ marginTop: 14 }}>
        <button
          className="btn btn-primary"
          disabled={remaining !== 0}
          onClick={() => onDone(alloc)}
        >
          {remaining === 0 ? '✅ この配分で決定' : `あと ${remaining} ポイント配分してください`}
        </button>
      </div>

      {/* ステータス解説 */}
      <div className="card" style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text2)' }}>
        <div style={{ marginBottom: 4, fontWeight: 700, color: 'var(--text)' }}>ステータス解説</div>
        <div>⚔️ <b>A</b>: ダメージ = A×倍率×100/(100+B)</div>
        <div>🛡️ <b>B</b>: 防御値が高いほど被ダメ軽減（貫通では無効）</div>
        <div>⚡ <b>S</b>: 先手確率 = 50 + (自S-相手S)×1.5 [10%〜90%]</div>
        <div>🔮 <b>T</b>: 特殊技の効果範囲が上限に近づく</div>
        <div>❤️ <b>H</b>: 最大HP = 100 + H</div>
      </div>
    </div>
  );
}
