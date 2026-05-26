import { useState } from 'react';
import SkillButton from './SkillButton.jsx';
import BattleLog from './BattleLog.jsx';
import { BUILTIN_SKILLS } from '../gameLogic/skills.js';

// HP バー
const HpBar = ({ current, max, isEnemy, isOnline }) => {
  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const cls = isEnemy ? 'hp-bar-enemy' : 'hp-bar-player';
  return (
    <div className={`hp-bar-wrap ${cls}`}>
      <div className="hp-bar-label">
        <span>HP</span>
        <span>
          {isOnline && isEnemy ? `${pct}%` : `${current} / ${max} (${pct}%)`}
        </span>
      </div>
      <div className="hp-bar-outer">
        <div className="hp-bar-inner" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// バフ・デバフバッジ
const StatModBadges = ({ statMods = {}, permMods = {}, reflectActive }) => {
  const badges = [];
  for (const stat of ['A', 'B', 'S']) {
    const combined = (statMods[stat] || 1.0) * (permMods[stat] || 1.0);
    if (Math.abs(combined - 1.0) > 0.005) {
      const pct = Math.round((combined - 1.0) * 100);
      badges.push(
        <span key={stat} className={`stat-mod-badge ${pct > 0 ? 'stat-mod-buff' : 'stat-mod-debuff'}`}>
          {stat}{pct > 0 ? '+' : ''}{pct}%
        </span>
      );
    }
  }
  if (reflectActive > 0) {
    badges.push(
      <span key="reflect" className="stat-mod-badge" style={{ background: 'rgba(100,116,139,0.3)', color: '#cbd5e1' }}>
        反射{Math.round(reflectActive * 100)}%
      </span>
    );
  }
  return badges.length > 0 ? <div className="stat-mods-row">{badges}</div> : null;
};

// 勝敗画面
const ResultScreen = ({ winner, onRematch, onHome }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div className="result-emoji">
      {winner === 'player' ? '🏆' : winner === 'draw' ? '🤝' : '💀'}
    </div>
    <div className={`result-title ${winner === 'player' ? 'result-win' : winner === 'draw' ? 'result-draw' : 'result-lose'}`}>
      {winner === 'player' ? '勝利！' : winner === 'draw' ? '引き分け' : '敗北…'}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24, width: '100%' }}>
      {onRematch && <button className="btn btn-primary" onClick={onRematch}>もう一度</button>}
      <button className="btn btn-ghost" onClick={onHome}>ホームへ</button>
    </div>
  </div>
);

// 待機画面
const WaitingScreen = ({ opponentActed }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 }}>
    <div className="spinner" />
    <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
      {opponentActed ? '✅ 相手は行動を選択済み' : '⏳ 相手の行動を待っています'}
    </p>
  </div>
);

// バフ/デバフ対象選択
const StatTargetPicker = ({ title, onSelect, onCancel, selected }) => (
  <div>
    <h3 style={{ marginBottom: 8, fontSize: '1rem' }}>{title}</h3>
    <div className="sub-target-grid">
      {['A', 'B', 'S'].map(stat => {
        const desc = { A: 'こうげき', B: 'ぼうぎょ', S: 'すばやさ' }[stat];
        return (
          <button key={stat} className={`sub-target-btn ${selected === stat ? 'selected' : ''}`}
            onClick={() => onSelect(stat)}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{stat}</div>
            <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>{desc}</div>
          </button>
        );
      })}
    </div>
    <button className="btn btn-ghost btn-sm" onClick={onCancel}>キャンセル</button>
  </div>
);

// 行動制限 技選択
const ActionTargetPicker = ({ onSelect, onCancel, selected, availableSkills }) => {
  const skills = availableSkills || BUILTIN_SKILLS;
  return (
    <div>
      <h3 style={{ marginBottom: 8, fontSize: '1rem' }}>封じる技を選択</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
        {skills.map(s => (
          <button key={s.id}
            className={`sub-target-btn ${selected === s.id ? 'selected' : ''}`}
            style={{ padding: '8px 6px', fontSize: '0.82rem' }}
            onClick={() => onSelect(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onCancel}>キャンセル</button>
    </div>
  );
};

export default function BattleScreen({
  playerState,
  enemyState,
  turn,
  phase,
  isOnline,
  onAction,
  battleLog,
  winner,
  availableSkills,
  onRematch,
  onHome,
  opponentActed,
  enemyLabel,
}) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [subTarget, setSubTarget] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [showSubPicker, setShowSubPicker] = useState(false);

  const handleSelect = (skill) => {
    if (selectedSkill?.id === skill.id) {
      // 同じ技をタップ → サブピッカーがある場合は開く
      if (skill.requiresTarget) {
        setShowSubPicker(true);
      }
      return;
    }
    setSelectedSkill(skill);
    setSubTarget(null);
    setShowSubPicker(false);
    // requiresTarget がある技はすぐにサブピッカーを開く
    if (skill.requiresTarget) {
      setShowSubPicker(true);
    }
  };

  const handleCancel = () => {
    setSelectedSkill(null);
    setSubTarget(null);
    setShowSubPicker(false);
  };

  const handleConfirm = () => {
    if (!selectedSkill) return;
    onAction({ skill: selectedSkill, subTarget });
    setSelectedSkill(null);
    setSubTarget(null);
    setShowSubPicker(false);
  };

  const needsSubTarget = selectedSkill?.requiresTarget && !subTarget;
  const canConfirm = selectedSkill && !needsSubTarget;

  const firstStrikeProb = (() => {
    if (!playerState || !enemyState) return 50;
    const ps = Math.max(1, playerState.baseStats.S * (playerState.statMods?.S || 1) * (playerState.permMods?.S || 1));
    const es = Math.max(1, enemyState.baseStats.S * (enemyState.statMods?.S || 1) * (enemyState.permMods?.S || 1));
    return Math.min(90, Math.max(10, 50 + (ps - es) * 1.5));
  })();

  if (!playerState || !enemyState) return null;

  return (
    <div className="page">
      {/* バトルエリア上部（HP・情報） */}
      <div className="battle-top">
        {/* 敵 */}
        <div className="fighter-card">
          <div className="fighter-avatar" style={{ background: 'linear-gradient(135deg, #3b0e0e, #7f1d1d)' }}>
            👹
          </div>
          <div className="fighter-info">
            <div className="fighter-name">{enemyLabel || (isOnline ? '相手プレイヤー' : '🤖 CPU')}</div>
            <HpBar
              current={enemyState.currentHP}
              max={enemyState.maxHP}
              isEnemy
              isOnline={isOnline}
            />
            <StatModBadges
              statMods={enemyState.statMods}
              permMods={enemyState.permMods}
              reflectActive={enemyState.reflectActive}
            />
          </div>
        </div>

        <hr className="divider" style={{ margin: '6px 0' }} />

        {/* 自分 */}
        <div className="fighter-card">
          <div className="fighter-avatar" style={{ background: 'linear-gradient(135deg, #0e1b3b, #1e3a8a)' }}>
            🗡️
          </div>
          <div className="fighter-info">
            <div className="fighter-name">あなた</div>
            <HpBar
              current={playerState.currentHP}
              max={playerState.maxHP}
              isEnemy={false}
              isOnline={false}
            />
            <StatModBadges
              statMods={playerState.statMods}
              permMods={playerState.permMods}
              reflectActive={playerState.reflectActive}
            />
          </div>
        </div>

        <div className="turn-indicator">
          ターン <span className="turn-number">{turn}</span>
          &nbsp;｜&nbsp;先手確率 <span style={{ color: firstStrikeProb >= 50 ? 'var(--success)' : 'var(--danger)' }}>
            {Math.round(firstStrikeProb)}%
          </span>
          {selectedSkill && (
            <span style={{ color: 'var(--accent2)' }}>&nbsp;｜ {selectedSkill.name} 選択中</span>
          )}
        </div>
      </div>

      {/* バトルログ */}
      <div style={{ height: 90, flexShrink: 0 }}>
        <BattleLog entries={battleLog} />
      </div>

      {/* メインエリア */}
      {phase === 'ended' ? (
        <ResultScreen winner={winner} onRematch={onRematch} onHome={onHome} />
      ) : phase === 'waiting' ? (
        <WaitingScreen opponentActed={opponentActed} />
      ) : (
        <>
          {/* 技グリッド */}
          <div className="skill-grid" style={{ flex: 1, overflowY: 'auto', alignContent: 'start' }}>
            {availableSkills.map(skill => (
              <SkillButton
                key={skill.id}
                skill={skill}
                selected={selectedSkill?.id === skill.id}
                disabled={skill.disabled || skill.restricted}
                restricted={skill.restricted}
                cooldownLeft={skill.id === 'strong' ? (playerState.cooldowns?.strong || 0) : 0}
                onSelect={handleSelect}
                onShowDetail={setShowDetail}
              />
            ))}
          </div>

          {/* 確定バー */}
          {selectedSkill && (
            <div className="confirm-row">
              <button className="btn btn-ghost" onClick={handleCancel}>
                キャンセル
              </button>
              <button
                className="btn btn-primary"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                {needsSubTarget ? '対象を選んでください' : `✅ ${selectedSkill.name}で決定`}
              </button>
            </div>
          )}
        </>
      )}

      {/* 技詳細モーダル（長押し） */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: showDetail.color || '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
              }}>⚡</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{showDetail.name}</div>
                {showDetail.hint && <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{showDetail.hint}</div>}
              </div>
            </div>
            <p>{showDetail.description}</p>
            {showDetail.cost && showDetail.cost.length > 0 && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>代償（コスト）</div>
                {showDetail.cost.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                    次ターン {c.target === 'self' ? '自分の' : ''}{c.stat} ×{c.mult}（{Math.round((c.mult - 1) * 100)}%）
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => setShowDetail(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* サブターゲット選択（バフ/デバフ/行動制限） */}
      {showSubPicker && selectedSkill && (
        <div className="modal-overlay" onClick={() => { setShowSubPicker(false); handleCancel(); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {(selectedSkill.requiresTarget === 'selfStat') && (
              <StatTargetPicker
                title="🔼 強化するステータスを選択"
                selected={subTarget}
                onSelect={(s) => { setSubTarget(s); setShowSubPicker(false); }}
                onCancel={() => { setShowSubPicker(false); handleCancel(); }}
              />
            )}
            {(selectedSkill.requiresTarget === 'enemyStat') && (
              <StatTargetPicker
                title="🔽 弱体化するステータスを選択"
                selected={subTarget}
                onSelect={(s) => { setSubTarget(s); setShowSubPicker(false); }}
                onCancel={() => { setShowSubPicker(false); handleCancel(); }}
              />
            )}
            {(selectedSkill.requiresTarget === 'enemyAction') && (
              <ActionTargetPicker
                selected={subTarget}
                availableSkills={BUILTIN_SKILLS}
                onSelect={(id) => { setSubTarget(id); setShowSubPicker(false); }}
                onCancel={() => { setShowSubPicker(false); handleCancel(); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
