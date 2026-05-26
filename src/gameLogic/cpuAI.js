// ===== CPU AI =====
import { BUILTIN_SKILLS, getCustomSkills } from './skills.js';
import { getEffectiveStat } from './battleCalc.js';

export const getCpuAction = (cpuState, playerState, turn) => {
  const customs = getCustomSkills();
  const allSkills = [...BUILTIN_SKILLS, ...customs];

  // 使用可能な技を絞り込む
  const available = allSkills.filter(skill => {
    if (skill.id === 'strong' && cpuState.cooldowns?.strong > 0) return false;
    if (cpuState.restrictedActions?.includes(skill.id)) return false;
    return true;
  });

  const hpRatio = cpuState.currentHP / cpuState.maxHP;
  const playerHpRatio = playerState.currentHP / playerState.maxHP;
  const playerB = getEffectiveStat(playerState, 'B');
  const rnd = Math.random();

  const find = (id) => available.find(s => s.id === id);

  // === 低HP時の生存戦略 ===
  if (hpRatio < 0.25) {
    const absorb = find('absorb');
    const reflect = find('reflect');
    const ratio = find('ratio');
    if (absorb && rnd < 0.55) return { skill: absorb };
    if (reflect && rnd < 0.75) return { skill: reflect };
    if (ratio && rnd < 0.85) return { skill: ratio };
  }

  // === 中HP時の混合戦略 ===
  if (hpRatio < 0.55) {
    const buff = find('buff');
    const debuff = find('debuff');
    const absorb = find('absorb');
    const ratio = find('ratio');
    if (absorb && rnd < 0.30) return { skill: absorb };
    if (buff && rnd < 0.45) return { skill: buff, subTarget: 'A' };
    if (debuff && playerHpRatio > 0.4 && rnd < 0.55) return { skill: debuff, subTarget: 'A' };
    if (ratio && rnd < 0.65) return { skill: ratio };
  }

  // === 相手が低HPなら強い技で決める ===
  if (playerHpRatio < 0.30) {
    const strong = find('strong');
    const superattack = find('superattack');
    const combo = find('combo');
    if (strong && rnd < 0.40) return { skill: strong };
    if (superattack && rnd < 0.65) return { skill: superattack };
    if (combo && rnd < 0.80) return { skill: combo };
  }

  // === 相手の防御が高い場合は貫通を使う ===
  if (playerB > 40) {
    const pierce = find('pierce');
    if (pierce && rnd < 0.55) return { skill: pierce };
  }

  // === 通常の攻撃判断 ===
  const table = [
    { id: 'strong',      weight: 20 },
    { id: 'superattack', weight: 10 },
    { id: 'combo',       weight: 18 },
    { id: 'pierce',      weight: 15 },
    { id: 'swift',       weight: 12 },
    { id: 'normal',      weight: 25 },
  ];

  const pool = [];
  for (const entry of table) {
    const sk = find(entry.id);
    if (sk) for (let i = 0; i < entry.weight; i++) pool.push(sk);
  }

  if (pool.length > 0) {
    return { skill: pool[Math.floor(Math.random() * pool.length)] };
  }

  // === フォールバック ===
  return { skill: available[0] || BUILTIN_SKILLS[0] };
};
