// ===== ゲーム定数 =====
// ここを変更するだけで細かい数値調整が可能

export const GC = {
  // ステータス基本値
  BASE_HP: 100,              // HPの基礎値
  DISTRIBUTE_POINTS: 120,   // 分配可能ポイント
  MIN_STAT: 5,              // A/B/S/Tの最低値

  // 速度・先手計算
  FIRST_STRIKE_BASE: 50,        // 先手確率の基礎値 (%)
  FIRST_STRIKE_SPEED_MULT: 1.5, // 速度差の影響係数
  FIRST_STRIKE_MAX: 90,         // 先手確率の上限 (%)
  FIRST_STRIKE_MIN: 10,         // 先手確率の下限 (%)

  // 攻撃技
  STRONG_COOLDOWN: 2,       // 強攻撃クールダウン（ターン数）
  COMBO_HITS: 3,            // 連撃のヒット数
  COMBO_MULT_PER_HIT: 0.45, // 連撃1ヒットあたりの倍率

  // 特殊技の効果範囲（T低→下限、T高→上限に近づく）
  RATIO_DMG_MIN: 0.05,      // 割合攻撃の最小割合 (5%)
  RATIO_DMG_MAX: 0.10,      // 割合攻撃の最大割合 (10%)
  ABSORB_MULT: 0.7,         // 吸収のダメージ倍率
  ABSORB_HEAL_MIN: 0.20,    // 吸収の最小回復割合 (20%)
  ABSORB_HEAL_MAX: 0.40,    // 吸収の最大回復割合 (40%)
  SUPER_ATTACK_CHANCE: 0.15,     // 超攻撃の発動確率 (15%)
  SUPER_ATTACK_MULT: 2.3,        // 超攻撃発動時の倍率
  SUPER_ATTACK_B_PENALTY: 0.85,  // 超攻撃発動時のB永続デメリット
  BUFF_AMOUNT: 1.20,        // バフの上昇量 (+20%)
  DEBUFF_AMOUNT: 0.80,      // デバフの低下量 (-20%)
  REFLECT_MIN: 0.30,        // 反射の最小割合 (30%)
  REFLECT_MAX: 0.50,        // 反射の最大割合 (50%)
  T_MAX_EFFECTIVE: 120,     // T技巧の最大有効値

  // コスト（代償）係数
  COST_STRONG_S: 0.90,      // 強攻撃使用後 S×0.9
  COST_STRONG_B: 0.90,      // 強攻撃使用後 B×0.9
  COST_RATIO_S: 0.90,       // 割合攻撃使用後 S×0.9 (次ターン)
  COST_ABSORB_A: 0.85,      // 吸収使用後 A×0.85 (次ターン)
  COST_REFLECT_A: 0.90,     // 反射使用後 A×0.9 (次ターン)
  COST_RESTRICT_S: 0.75,    // 行動制限使用後 S×0.75 (次ターン)
  COST_BUFF_A_THEN_B: 0.80, // Aバフ→次ターンB×0.8
  COST_BUFF_B_THEN_A: 0.80, // Bバフ→次ターンA×0.8
  COST_BUFF_S_THEN_A: 0.85, // Sバフ→次ターンA×0.85
  COST_DEBUFF_A_THEN_B: 0.80,
  COST_DEBUFF_B_THEN_A: 0.80,
  COST_DEBUFF_S_THEN_A: 0.85,

  // CPU設定
  CPU_DEFAULT_STATS: { H: 40, A: 25, B: 20, S: 20, T: 15 }, // CPUのデフォルトステータス
};
