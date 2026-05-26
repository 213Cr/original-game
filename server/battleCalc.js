// ===== バトル計算エンジン (サーバー側・CommonJS) =====
const { GC } = require('./constants.js');

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const tInfluence = (t, min, max) => {
  const ratio = Math.min(t / GC.T_MAX_EFFECTIVE, 1);
  return min + (max - min) * ratio;
};

const createPlayerState = (allocPoints) => {
  const { H = 0, A = 5, B = 5, S = 5, T = 5 } = allocPoints;
  return {
    baseStats: {
      A: Math.max(GC.MIN_STAT, A),
      B: Math.max(GC.MIN_STAT, B),
      S: Math.max(GC.MIN_STAT, S),
      T: Math.max(GC.MIN_STAT, T),
    },
    maxHP: GC.BASE_HP + (H || 0),
    currentHP: GC.BASE_HP + (H || 0),
    statMods: { A: 1.0, B: 1.0, S: 1.0 },
    permMods: { A: 1.0, B: 1.0, S: 1.0 },
    pendingMods: {},
    cooldowns: { strong: 0 },
    reflectActive: 0,
    restrictedActions: [],
  };
};

const getEffectiveStat = (state, stat) => {
  const base = state.baseStats[stat] || GC.MIN_STAT;
  const mod = state.statMods[stat] || 1.0;
  const perm = state.permMods[stat] || 1.0;
  return Math.max(1, base * mod * perm);
};

const calcFirstStrikeProb = (ps, es) => {
  const p = getEffectiveStat(ps, 'S');
  const e = getEffectiveStat(es, 'S');
  const prob = GC.FIRST_STRIKE_BASE + (p - e) * GC.FIRST_STRIKE_SPEED_MULT;
  return Math.min(GC.FIRST_STRIKE_MAX, Math.max(GC.FIRST_STRIKE_MIN, prob));
};

const calcDamage = (att, def, mult, ignoreDefense) => {
  const A = getEffectiveStat(att, 'A');
  const B = ignoreDefense ? 0 : getEffectiveStat(def, 'B');
  return Math.max(1, Math.floor(A * mult * (100 / (100 + B))));
};

const applyPendingEffects = (state) => {
  const s = deepClone(state);
  for (const stat of ['A', 'B', 'S']) {
    if (s.pendingMods[stat]) {
      s.statMods[stat] = Math.max(0.1, (s.statMods[stat] || 1.0) * s.pendingMods[stat]);
    }
  }
  s.pendingMods = {};
  if (s.cooldowns.strong > 0) s.cooldowns.strong--;
  return s;
};

const queueCost = (state, costs) => {
  if (!costs) return state;
  const s = deepClone(state);
  for (const c of costs) {
    if (c.timing !== 'next' || c.target !== 'self') continue;
    s.pendingMods[c.stat] = (s.pendingMods[c.stat] || 1.0) * c.mult;
  }
  return s;
};

const handleReflect = (att, def, dmg, log) => {
  let a = att, d = def;
  if (d.reflectActive > 0) {
    const reflDmg = Math.max(1, Math.floor(dmg * d.reflectActive));
    a = deepClone(a);
    a.currentHP = Math.max(0, a.currentHP - reflDmg);
    d = deepClone(d);
    d.reflectActive = 0;
    log.push(`🔄 反射！${reflDmg}ダメージが跳ね返った`);
  }
  return { att: a, def: d };
};

const resolveAction = (action, attackerState, defenderState) => {
  let att = deepClone(attackerState);
  let def = deepClone(defenderState);
  const log = [];

  if (!action || !action.skill) {
    log.push('行動なし');
    return { attackerState: att, defenderState: def, log };
  }

  const { skill, subTarget } = action;
  const T = att.baseStats.T;

  if (skill.type === 'attack') {
    if (skill.hits && skill.hits > 1) {
      let totalDmg = 0;
      for (let i = 0; i < skill.hits; i++) {
        const d = calcDamage(att, def, skill.multiplierPerHit || 0.45, false);
        totalDmg += d;
        def.currentHP = Math.max(0, def.currentHP - d);
      }
      log.push(`💥 連撃！${skill.hits}連続ヒット、合計${totalDmg}ダメージ`);
      const r = handleReflect(att, def, totalDmg, log);
      att = r.att; def = r.def;
    } else {
      const dmg = calcDamage(att, def, skill.multiplier || 1.0, skill.ignoreDefense || false);
      def.currentHP = Math.max(0, def.currentHP - dmg);
      const tag = skill.priority ? '（先制）' : skill.ignoreDefense ? '（防御無視）' : '';
      log.push(`⚔️ ${skill.name}${tag}で${dmg}ダメージ！`);
      const r = handleReflect(att, def, dmg, log);
      att = r.att; def = r.def;
      if (skill.id === 'strong') att.cooldowns.strong = skill.cooldownMax || GC.STRONG_COOLDOWN;
    }
    att = queueCost(att, skill.cost);
  } else if (skill.type === 'special') {
    switch (skill.specialType) {
      case 'ratio': {
        const pct = tInfluence(T, GC.RATIO_DMG_MIN, GC.RATIO_DMG_MAX);
        const dmg = Math.max(1, Math.floor(def.maxHP * pct));
        def.currentHP = Math.max(0, def.currentHP - dmg);
        log.push(`💢 割合攻撃！敵最大HPの${(pct * 100).toFixed(1)}%＝${dmg}ダメージ`);
        const r = handleReflect(att, def, dmg, log);
        att = r.att; def = r.def;
        att = queueCost(att, skill.cost);
        break;
      }
      case 'absorb': {
        const dmg = calcDamage(att, def, GC.ABSORB_MULT, false);
        def.currentHP = Math.max(0, def.currentHP - dmg);
        const healPct = tInfluence(T, GC.ABSORB_HEAL_MIN, GC.ABSORB_HEAL_MAX);
        const heal = Math.max(1, Math.floor(dmg * healPct));
        att.currentHP = Math.min(att.maxHP, att.currentHP + heal);
        log.push(`🩸 吸収！${dmg}ダメージ＋${heal}HP回復`);
        const r = handleReflect(att, def, dmg, log);
        att = r.att; def = r.def;
        att = queueCost(att, skill.cost);
        break;
      }
      case 'superattack': {
        const triggered = Math.random() < GC.SUPER_ATTACK_CHANCE;
        if (triggered) {
          const dmg = calcDamage(att, def, GC.SUPER_ATTACK_MULT, false);
          def.currentHP = Math.max(0, def.currentHP - dmg);
          att.permMods.B = Math.max(0.1, (att.permMods.B || 1.0) * GC.SUPER_ATTACK_B_PENALTY);
          log.push(`🔥 超攻撃発動！！A×2.3で${dmg}の超ダメージ！（自分のB永続-15%）`);
          const r = handleReflect(att, def, dmg, log);
          att = r.att; def = r.def;
        } else {
          const dmg = calcDamage(att, def, 1.0, false);
          def.currentHP = Math.max(0, def.currentHP - dmg);
          log.push(`😮 超攻撃は不発… 通常攻撃で${dmg}ダメージ`);
          const r = handleReflect(att, def, dmg, log);
          att = r.att; def = r.def;
        }
        break;
      }
      case 'buff': {
        const stat = subTarget || 'A';
        att.statMods[stat] = (att.statMods[stat] || 1.0) * GC.BUFF_AMOUNT;
        log.push(`✨ バフ！${stat}が+20%（×${att.statMods[stat].toFixed(2)}）`);
        if (stat === 'A') att.pendingMods.B = (att.pendingMods.B || 1.0) * GC.COST_BUFF_A_THEN_B;
        else if (stat === 'B') att.pendingMods.A = (att.pendingMods.A || 1.0) * GC.COST_BUFF_B_THEN_A;
        else if (stat === 'S') att.pendingMods.A = (att.pendingMods.A || 1.0) * GC.COST_BUFF_S_THEN_A;
        break;
      }
      case 'debuff': {
        const stat = subTarget || 'A';
        def.statMods[stat] = (def.statMods[stat] || 1.0) * GC.DEBUFF_AMOUNT;
        log.push(`💫 デバフ！敵${stat}が-20%（×${def.statMods[stat].toFixed(2)}）`);
        if (stat === 'A') att.pendingMods.B = (att.pendingMods.B || 1.0) * GC.COST_DEBUFF_A_THEN_B;
        else if (stat === 'B') att.pendingMods.A = (att.pendingMods.A || 1.0) * GC.COST_DEBUFF_B_THEN_A;
        else if (stat === 'S') att.pendingMods.A = (att.pendingMods.A || 1.0) * GC.COST_DEBUFF_S_THEN_A;
        break;
      }
      case 'reflect': {
        const pct = tInfluence(T, GC.REFLECT_MIN, GC.REFLECT_MAX);
        att.reflectActive = pct;
        log.push(`🛡️ 反射構え！受けたダメの${(pct * 100).toFixed(0)}%を反射`);
        att = queueCost(att, skill.cost);
        break;
      }
      case 'restrict': {
        const targetId = subTarget || 'normal';
        if (!def.restrictedActions) def.restrictedActions = [];
        def.restrictedActions.push(targetId);
        log.push(`🚫 行動制限！次ターン相手の「${targetId}」を封印`);
        att = queueCost(att, skill.cost);
        break;
      }
      default: {
        if (skill.multiplier) {
          const dmg = calcDamage(att, def, skill.multiplier, skill.ignoreDefense || false);
          def.currentHP = Math.max(0, def.currentHP - dmg);
          log.push(`⚡ ${skill.name}で${dmg}ダメージ！`);
          const r = handleReflect(att, def, dmg, log);
          att = r.att; def = r.def;
        }
        att = queueCost(att, skill.cost);
      }
    }
  }

  return { attackerState: att, defenderState: def, log };
};

const determineFirstStrike = (ps, es, pa, ea) => {
  const pSwift = pa?.skill?.priority;
  const eSwift = ea?.skill?.priority;
  if (pSwift && !eSwift) return 0;
  if (eSwift && !pSwift) return 1;
  const prob = calcFirstStrikeProb(ps, es);
  return Math.random() * 100 < prob ? 0 : 1;
};

const resolveTurn = (gameState, actions, turn) => {
  let ps = deepClone(gameState.players[0]);
  let es = deepClone(gameState.players[1]);
  const log = [];

  log.push(`--- ターン ${turn} ---`);

  ps = applyPendingEffects(ps);
  es = applyPendingEffects(es);

  let pa = actions[0];
  let ea = actions[1];
  const p0Restricted = [...(ps.restrictedActions || [])];
  const p1Restricted = [...(es.restrictedActions || [])];
  ps.restrictedActions = [];
  es.restrictedActions = [];

  if (pa?.skill && p0Restricted.includes(pa.skill.id)) {
    log.push(`🚫 「${pa.skill.name}」が封印されている！`);
    pa = null;
  }
  if (ea?.skill && p1Restricted.includes(ea.skill.id)) {
    log.push(`🚫 相手の「${ea.skill.name}」が封印されている！`);
    ea = null;
  }

  const firstIdx = determineFirstStrike(ps, es, pa, ea);
  const prob = calcFirstStrikeProb(ps, es);
  log.push(`⚡ ${firstIdx === 0 ? 'プレイヤー0が' : 'プレイヤー1が'}先手！（先手確率${firstIdx === 0 ? prob.toFixed(0) : (100 - prob).toFixed(0)}%）`);

  const states = [ps, es];
  const acts = [pa, ea];

  const resolveFor = (actorIdx) => {
    const defIdx = 1 - actorIdx;
    if (acts[actorIdx]) {
      const r = resolveAction(acts[actorIdx], states[actorIdx], states[defIdx]);
      states[actorIdx] = r.attackerState;
      states[defIdx] = r.defenderState;
      const prefix = actorIdx === 0 ? '▶' : '◀';
      log.push(...r.log.map(l => `${prefix} ${l}`));
    }
  };

  resolveFor(firstIdx);
  if (states[1 - firstIdx].currentHP > 0) resolveFor(1 - firstIdx);

  let winner = null;
  if (states[0].currentHP <= 0 && states[1].currentHP <= 0) {
    winner = 'draw'; log.push('🤝 引き分け！');
  } else if (states[0].currentHP <= 0) {
    winner = 1; log.push('💀 プレイヤー0が倒された！');
  } else if (states[1].currentHP <= 0) {
    winner = 0; log.push('🎉 プレイヤー0の勝利！');
  }

  return {
    gameState: { ...gameState, players: states },
    log,
    winner,
  };
};

module.exports = { createPlayerState, resolveTurn, getEffectiveStat, calcFirstStrikeProb };
