module.exports = {
  // 打分倍率默认配置
  scoreMultipliers: {
    3: 1.5,
    2: 1.0,
    1: 0.6
  },

  // 基础积分范围
  basePointsMin: 1,
  basePointsMax: 50,
  basePointsDefault: 10,

  // 小抽奖默认配置
  smallDraw: {
    cost: 20,
    items: [
      { name: '5-15积分', type: 'points', pointsValue: { min: 5, max: 15 },  weight: 60, rarity: 'common',    icon: '⭐' },
      { name: '20-30积分', type: 'points', pointsValue: { min: 20, max: 30 }, weight: 25, rarity: 'rare',      icon: '🌟' },
      { name: '50积分+小零食', type: 'reward', pointsValue: 50, rewardTitle: '小零食一份', rewardDescription: '家长准备的小零食', weight: 10, rarity: 'epic', icon: '🍬' },
      { name: '100积分+特别奖励', type: 'reward', pointsValue: 100, rewardTitle: '特别奖励', rewardDescription: '可兑换一次特别活动', weight: 5, rarity: 'legendary', icon: '🎁' }
    ]
  },

  // 大抽奖默认配置
  bigDraw: {
    cost: 80,
    items: [
      { name: '30-60积分', type: 'points', pointsValue: { min: 30, max: 60 },   weight: 50, rarity: 'common',    icon: '⭐' },
      { name: '80-120积分', type: 'points', pointsValue: { min: 80, max: 120 },  weight: 25, rarity: 'rare',      icon: '🌟' },
      { name: '200积分+中奖励', type: 'reward', pointsValue: 200, rewardTitle: '中等奖励', rewardDescription: '如看动画片30分钟', weight: 15, rarity: 'epic', icon: '🎬' },
      { name: '500积分+大奖励', type: 'reward', pointsValue: 500, rewardTitle: '豪华大奖', rewardDescription: '如去游乐园', weight: 10, rarity: 'legendary', icon: '🎪' }
    ]
  },

  // 抽奖消耗积分范围
  drawCostMin: 5,
  drawCostMax: 500,

  // 积分 slider 范围
  pointsSliderMin: 1,
  pointsSliderMax: 50
};
