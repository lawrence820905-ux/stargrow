const RARITY_RATES = { common: 60, rare: 25, epic: 10, legendary: 5 };
const RARITY_ORDER = ['legendary', 'epic', 'rare', 'common'];

function twoStepDraw(items) {
  if (!items || items.length === 0) return null;

  // 按稀有度分组
  const groups = { common: [], rare: [], epic: [], legendary: [] };
  items.forEach(item => {
    const r = item.rarity || 'common';
    if (groups[r]) groups[r].push(item);
  });

  // 第一步：按固定概率抽稀有度级别
  const rarity = weightedRarity();
  if (groups[rarity].length > 0) {
    return groups[rarity][Math.floor(Math.random() * groups[rarity].length)];
  }

  // 如果抽中的级别无奖品，按稀有度降级查找最近的
  for (const r of RARITY_ORDER) {
    if (groups[r].length > 0) {
      return groups[r][Math.floor(Math.random() * groups[r].length)];
    }
  }
  return items[0];
}

function weightedRarity() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const [rarity, rate] of Object.entries(RARITY_RATES)) {
    cumulative += rate;
    if (rand <= cumulative) return rarity;
  }
  return 'common';
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcProbabilities(items) {
  if (!items || items.length === 0) return [];

  const groups = { common: [], rare: [], epic: [], legendary: [] };
  items.forEach(item => {
    const r = item.rarity || 'common';
    if (groups[r]) groups[r].push(item);
  });

  return items.map(item => {
    const rarity = item.rarity || 'common';
    const sameRarityCount = groups[rarity].length;
    const prob = sameRarityCount > 0 ? RARITY_RATES[rarity] / sameRarityCount : 0;
    return { ...item, probability: Math.round(prob) };
  });
}

function simulateDraws(items, count = 1000) {
  const results = {};
  items.forEach(item => { results[item.name] = 0; });
  for (let i = 0; i < count; i++) {
    const prize = twoStepDraw(items);
    if (prize) {
      results[prize.name] = (results[prize.name] || 0) + 1;
    }
  }
  return Object.entries(results).map(([name, count]) => ({
    name,
    count,
    actualRate: ((count / (count || 1)) * 100).toFixed(1)
  }));
}

module.exports = {
  twoStepDraw,
  randBetween,
  calcProbabilities,
  simulateDraws,
  RARITY_RATES
};
