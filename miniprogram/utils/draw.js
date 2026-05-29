function weightedRandom(items) {
  if (!items || items.length === 0) return null;
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (totalWeight <= 0) return items[0];

  let rand = Math.random() * totalWeight;
  for (const item of items) {
    rand -= (item.weight || 0);
    if (rand <= 0) return item;
  }
  return items[items.length - 1];
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcProbabilities(items) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (totalWeight <= 0) return items.map(item => ({ ...item, probability: 0 }));
  return items.map(item => ({
    ...item,
    probability: Math.round(((item.weight || 0) / totalWeight) * 100)
  }));
}

function simulateDraws(items, count = 1000) {
  const results = {};
  items.forEach(item => { results[item.name] = 0; });
  for (let i = 0; i < count; i++) {
    const prize = weightedRandom(items);
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
  weightedRandom,
  randBetween,
  calcProbabilities,
  simulateDraws
};
