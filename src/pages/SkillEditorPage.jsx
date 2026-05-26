import { useState } from 'react';
import { BUILTIN_SKILLS, getCustomSkills, saveCustomSkill, deleteCustomSkill } from '../gameLogic/skills.js';

const COLORS = [
  '#6366f1', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899',
  '#ef4444', '#10b981', '#f97316', '#a78bfa', '#f43f5e',
  '#64748b', '#7c3aed', '#22c55e', '#e879f9', '#38bdf8',
];

const SPECIAL_TYPES = [
  { id: 'ratio',       label: '割合攻撃', hint: '敵最大HPの割合ダメージ' },
  { id: 'absorb',      label: '吸収',     hint: 'ダメージを与えてHP回復' },
  { id: 'superattack', label: '超攻撃',   hint: '確率でA×2.3、発動時B永続-15%' },
  { id: 'buff',        label: 'バフ',     hint: '自分のステータス+20%' },
  { id: 'debuff',      label: 'デバフ',   hint: '敵のステータス-20%' },
  { id: 'reflect',     label: '反射',     hint: '受けたダメージを反射' },
  { id: 'restrict',    label: '行動制限', hint: '次ターン相手の技を封じる' },
];

const requiresTargetOf = (specialType) => {
  if (specialType === 'buff') return 'selfStat';
  if (specialType === 'debuff') return 'enemyStat';
  if (specialType === 'restrict') return 'enemyAction';
  return undefined;
};

const defaultForm = {
  name: '新しい技',
  color: '#6366f1',
  type: 'attack',
  multiplier: 1.0,
  ignoreDefense: false,
  priority: false,
  multiHit: false,
  hits: 3,
  multiplierPerHit: 0.45,
  specialType: 'ratio',
  description: '',
  costStat: 'S',
  costMult: 0.9,
  hasCost: false,
};

function SkillForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { ...defaultForm });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const buildSkill = () => {
    const base = {
      id: initial?.id || `custom_${Date.now()}`,
      name: form.name || '無名技',
      color: form.color,
      type: form.type,
      description: form.description || `${form.name}を使用する`,
      hint: form.type === 'attack' ? `倍率 ${form.multiplier}` : SPECIAL_TYPES.find(s => s.id === form.specialType)?.hint || '',
      cost: form.hasCost ? [{ target: 'self', stat: form.costStat, mult: parseFloat(form.costMult) || 0.9, timing: 'next' }] : null,
    };
    if (form.type === 'attack') {
      if (form.multiHit) {
        return { ...base, hits: parseInt(form.hits) || 3, multiplierPerHit: parseFloat(form.multiplierPerHit) || 0.45 };
      }
      return { ...base, multiplier: parseFloat(form.multiplier) || 1.0, ignoreDefense: form.ignoreDefense, priority: form.priority };
    } else {
      const requiresTarget = requiresTargetOf(form.specialType);
      return { ...base, specialType: form.specialType, requiresTarget, multiplier: 1.0 };
    }
  };

  const handleSave = () => {
    const skill = buildSkill();
    onSave(skill);
  };

  return (
    <div>
      {/* プレビュー */}
      <div className="skill-editor-preview" style={{ background: form.color, marginBottom: 14 }}>
        {form.name || '技名'}
      </div>

      {/* 技名 */}
      <div className="form-row">
        <label className="form-label">技名</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="技名を入力" />
      </div>

      {/* 色 */}
      <div className="form-row">
        <label className="form-label">ボタンカラー</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map(c => (
            <div key={c}
              onClick={() => set('color', c)}
              style={{
                width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer',
                border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                boxShadow: form.color === c ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
              }} />
          ))}
          <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }} />
        </div>
      </div>

      {/* タイプ */}
      <div className="form-row">
        <label className="form-label">技タイプ</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['attack', '⚔️ 攻撃技'], ['special', '✨ 特殊技']].map(([v, l]) => (
            <button key={v} className={`sub-target-btn ${form.type === v ? 'selected' : ''}`}
              onClick={() => set('type', v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* 攻撃技パラメータ */}
      {form.type === 'attack' && (
        <>
          <div className="toggle-row">
            <span style={{ fontSize: '0.9rem' }}>連撃（複数ヒット）</span>
            <div className={`toggle ${form.multiHit ? 'on' : ''}`} onClick={() => set('multiHit', !form.multiHit)} />
          </div>
          {!form.multiHit ? (
            <>
              <div className="form-row">
                <label className="form-label">倍率: {parseFloat(form.multiplier).toFixed(2)}x</label>
                <input type="range" className="stat-slider" min={5} max={300} step={5}
                  value={Math.round(form.multiplier * 100)}
                  onChange={e => set('multiplier', parseInt(e.target.value) / 100)}
                  style={{ width: '100%' }} />
              </div>
              <div className="toggle-row">
                <span style={{ fontSize: '0.9rem' }}>防御無視（貫通型）</span>
                <div className={`toggle ${form.ignoreDefense ? 'on' : ''}`} onClick={() => set('ignoreDefense', !form.ignoreDefense)} />
              </div>
              <div className="toggle-row">
                <span style={{ fontSize: '0.9rem' }}>必ず先手を取る</span>
                <div className={`toggle ${form.priority ? 'on' : ''}`} onClick={() => set('priority', !form.priority)} />
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <label className="form-label">ヒット数: {form.hits}</label>
                <input type="range" className="stat-slider" min={2} max={8} step={1}
                  value={form.hits} onChange={e => set('hits', parseInt(e.target.value))}
                  style={{ width: '100%' }} />
              </div>
              <div className="form-row">
                <label className="form-label">1ヒット倍率: {parseFloat(form.multiplierPerHit).toFixed(2)}x（合計: {(form.hits * form.multiplierPerHit).toFixed(2)}x）</label>
                <input type="range" className="stat-slider" min={5} max={200} step={5}
                  value={Math.round(form.multiplierPerHit * 100)}
                  onChange={e => set('multiplierPerHit', parseInt(e.target.value) / 100)}
                  style={{ width: '100%' }} />
              </div>
            </>
          )}
        </>
      )}

      {/* 特殊技パラメータ */}
      {form.type === 'special' && (
        <div className="form-row">
          <label className="form-label">特殊技の種類</label>
          <select className="form-select" value={form.specialType} onChange={e => set('specialType', e.target.value)}>
            {SPECIAL_TYPES.map(st => (
              <option key={st.id} value={st.id}>{st.label} — {st.hint}</option>
            ))}
          </select>
        </div>
      )}

      {/* コスト */}
      <hr className="divider" />
      <div className="toggle-row">
        <span style={{ fontSize: '0.9rem' }}>代償（コスト）を設定</span>
        <div className={`toggle ${form.hasCost ? 'on' : ''}`} onClick={() => set('hasCost', !form.hasCost)} />
      </div>
      {form.hasCost && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="form-row">
            <label className="form-label">ステータス</label>
            <select className="form-select" value={form.costStat} onChange={e => set('costStat', e.target.value)}>
              {['A', 'B', 'S'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">係数: ×{parseFloat(form.costMult).toFixed(2)}</label>
            <input type="range" className="stat-slider" min={50} max={99} step={1}
              value={Math.round(form.costMult * 100)}
              onChange={e => set('costMult', parseInt(e.target.value) / 100)}
              style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {/* 説明 */}
      <div className="form-row" style={{ marginTop: 8 }}>
        <label className="form-label">説明文（省略可）</label>
        <textarea className="input" value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="技の説明..."
          rows={2} style={{ resize: 'none', fontFamily: 'inherit' }} />
      </div>

      {/* 保存・キャンセル */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>
          💾 保存
        </button>
      </div>
    </div>
  );
}

export default function SkillEditorPage({ onBack }) {
  const [customs, setCustoms] = useState(() => getCustomSkills());
  const [mode, setMode] = useState('list'); // list | create | edit
  const [editTarget, setEditTarget] = useState(null);

  const refresh = () => setCustoms(getCustomSkills());

  const handleSave = (skill) => {
    saveCustomSkill(skill);
    refresh();
    setMode('list');
    setEditTarget(null);
  };

  const handleDelete = (skillId) => {
    if (!confirm(`「${skillId}」を削除しますか？`)) return;
    deleteCustomSkill(skillId);
    refresh();
  };

  const handleEdit = (skill) => {
    setEditTarget(skill);
    setMode('edit');
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-icon" onClick={mode === 'list' ? onBack : () => setMode('list')}>←</button>
        <h1>{mode === 'list' ? '🛠️ スキル管理' : mode === 'create' ? '✨ 新技作成' : '✏️ 技を編集'}</h1>
        {mode === 'list' && (
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', width: 'auto', padding: '8px 14px' }}
            onClick={() => { setEditTarget(null); setMode('create'); }}>
            ＋ 作成
          </button>
        )}
      </div>

      <div className="page-scroll">
        {mode === 'list' && (
          <>
            {/* カスタム技一覧 */}
            {customs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', padding: '30px 16px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔮</div>
                <p>カスタム技がありません</p>
                <p style={{ fontSize: '0.82rem' }}>「＋ 作成」から新しい技を作ってみよう！</p>
              </div>
            ) : (
              <>
                <div className="section-title">カスタム技 ({customs.length})</div>
                {customs.map(sk => (
                  <div key={sk.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, background: sk.color || '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
                    }}>⚡</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{sk.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{sk.hint || (sk.type === 'attack' ? `倍率×${sk.multiplier}` : sk.specialType)}</div>
                    </div>
                    <button className="btn-icon btn-sm" onClick={() => handleEdit(sk)} title="編集">✏️</button>
                    <button className="btn-icon btn-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                      onClick={() => handleDelete(sk.id)} title="削除">🗑️</button>
                  </div>
                ))}
              </>
            )}

            <hr className="divider" />

            {/* 組み込み技一覧（参照用） */}
            <div className="section-title">組み込み技（変更不可）</div>
            {BUILTIN_SKILLS.map(sk => (
              <div key={sk.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.75 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: sk.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
                }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{sk.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{sk.hint}</div>
                </div>
                <span className="badge badge-accent">組み込み</span>
              </div>
            ))}
          </>
        )}

        {(mode === 'create' || mode === 'edit') && (
          <SkillForm
            initial={editTarget}
            onSave={handleSave}
            onCancel={() => setMode('list')}
          />
        )}
      </div>
    </div>
  );
}
