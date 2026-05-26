// ===== 技定義ファイル =====
// 技を追加・変更するときはここを編集

export const BUILTIN_SKILLS = [
  {
    id: 'normal',
    name: '通常攻撃',
    type: 'attack',
    multiplier: 1.0,
    color: '#6366f1',
    hint: '倍率 1.0',
    description: '基本的な攻撃。ダメージ = A×1.0×{100/(100+B)}。制限なし、コストなし。',
    cost: null,
  },
  {
    id: 'strong',
    name: '強攻撃',
    type: 'attack',
    multiplier: 1.5,
    color: '#f59e0b',
    hint: '倍率 1.5 / 隔ターン',
    description: '強力な攻撃。倍率1.5倍。隔ターンのみ使用可能。代償：次ターン自分のS・B ×0.9。',
    cooldownMax: 2,
    cost: [
      { target: 'self', stat: 'S', mult: 0.90, timing: 'next' },
      { target: 'self', stat: 'B', mult: 0.90, timing: 'next' },
    ],
  },
  {
    id: 'swift',
    name: '速攻',
    type: 'attack',
    multiplier: 0.55,
    priority: true,
    color: '#06b6d4',
    hint: '倍率 0.55 / 必先手',
    description: '素早い攻撃。倍率0.55倍だが必ず先手を取る（相手も速攻の場合は速度比較）。コストなし。',
    cost: null,
  },
  {
    id: 'pierce',
    name: '貫通',
    type: 'attack',
    multiplier: 0.7,
    ignoreDefense: true,
    color: '#8b5cf6',
    hint: '倍率 0.7 / 防御無視',
    description: '防御を貫通する攻撃。倍率0.7倍だが相手のBを完全無視。相手の防御が高いほど有利。コストなし。',
    cost: null,
  },
  {
    id: 'combo',
    name: '連撃',
    type: 'attack',
    hits: 3,
    multiplierPerHit: 0.45,
    color: '#ec4899',
    hint: '3連撃 各×0.45',
    description: '3回連続で攻撃。各ヒット倍率0.45倍（合計1.35倍相当）。各ヒット最低1ダメージ保証。コストなし。',
    cost: null,
  },
  {
    id: 'ratio',
    name: '割合攻撃',
    type: 'special',
    specialType: 'ratio',
    color: '#ef4444',
    hint: '敵最大HP×5〜10%',
    description: '敵の最大HPの5〜10%のダメージ。Tが高いほど割合が上昇（T=5で5%、T=120で10%）。代償：次ターン自分のS ×0.9。',
    cost: [{ target: 'self', stat: 'S', mult: 0.90, timing: 'next' }],
  },
  {
    id: 'absorb',
    name: '吸収',
    type: 'special',
    specialType: 'absorb',
    color: '#10b981',
    hint: '与ダメの20〜40%回復',
    description: '0.7倍ダメージを与え、与ダメの20〜40%を回復。Tが高いほど回復率上昇。代償：次ターン自分のA ×0.85。',
    cost: [{ target: 'self', stat: 'A', mult: 0.85, timing: 'next' }],
  },
  {
    id: 'superattack',
    name: '超攻撃',
    type: 'special',
    specialType: 'superattack',
    color: '#f97316',
    hint: '15%でA×2.3 / B永続↓',
    description: '15%の確率でA×2.3の超大ダメージ。発動時：自分のBが永続-15%。不発時：通常攻撃(1.0倍)。',
    cost: null,
  },
  {
    id: 'buff',
    name: 'バフ',
    type: 'special',
    specialType: 'buff',
    requiresTarget: 'selfStat',
    color: '#a78bfa',
    hint: '自A/B/S +20%',
    description: '自分のA・B・Sのいずれか+20%（選択）。代償（次ターン）：A選択→B×0.8、B選択→A×0.8、S選択→A×0.85。',
    cost: null,
  },
  {
    id: 'debuff',
    name: 'デバフ',
    type: 'special',
    specialType: 'debuff',
    requiresTarget: 'enemyStat',
    color: '#f43f5e',
    hint: '敵A/B/S -20%',
    description: '敵のA・B・Sのいずれか-20%（選択）。代償（次ターン）：A選択→自B×0.8、B選択→自A×0.8、S選択→自A×0.85。',
    cost: null,
  },
  {
    id: 'reflect',
    name: '反射',
    type: 'special',
    specialType: 'reflect',
    color: '#64748b',
    hint: '受ダメの30〜50%反射',
    description: '今ターンに受けたダメージの30〜50%を相手に反射。Tが高いほど反射率上昇。代償：次ターン自分のA ×0.9。',
    cost: [{ target: 'self', stat: 'A', mult: 0.90, timing: 'next' }],
  },
  {
    id: 'restrict',
    name: '行動制限',
    type: 'special',
    specialType: 'restrict',
    requiresTarget: 'enemyAction',
    color: '#7c3aed',
    hint: '次ターン相手の技封じ',
    description: '次ターン、選択した技を相手が使用不能にする。代償：次ターン自分のS ×0.75。',
    cost: [{ target: 'self', stat: 'S', mult: 0.75, timing: 'next' }],
  },
];

// ===== カスタム技の保存・読み込み =====

export const getCustomSkills = () => {
  try {
    const stored = localStorage.getItem('customSkills');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

export const saveCustomSkill = (skill) => {
  const customs = getCustomSkills();
  const idx = customs.findIndex(s => s.id === skill.id);
  if (idx >= 0) customs[idx] = skill;
  else customs.push(skill);
  localStorage.setItem('customSkills', JSON.stringify(customs));
};

export const deleteCustomSkill = (skillId) => {
  const customs = getCustomSkills().filter(s => s.id !== skillId);
  localStorage.setItem('customSkills', JSON.stringify(customs));
};

export const getAllSkills = () => {
  return [...BUILTIN_SKILLS, ...getCustomSkills()];
};

// 技IDから技オブジェクトを取得
export const getSkillById = (id) => {
  return getAllSkills().find(s => s.id === id) || null;
};

// 行動制限の選択肢（どの技を封じるか）
export const RESTRICTABLE_SKILLS = [
  { id: 'normal', name: '通常攻撃' },
  { id: 'strong', name: '強攻撃' },
  { id: 'swift', name: '速攻' },
  { id: 'pierce', name: '貫通' },
  { id: 'combo', name: '連撃' },
  { id: 'ratio', name: '割合攻撃' },
  { id: 'absorb', name: '吸収' },
  { id: 'superattack', name: '超攻撃' },
  { id: 'buff', name: 'バフ' },
  { id: 'debuff', name: 'デバフ' },
  { id: 'reflect', name: '反射' },
  { id: 'restrict', name: '行動制限' },
];
