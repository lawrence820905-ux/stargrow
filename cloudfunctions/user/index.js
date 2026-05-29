const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    switch (action) {
      case 'login':
        return await login(OPENID, event);
      case 'getFamily':
        return await getFamily(OPENID);
      default:
        return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('user error:', err);
    return { code: 500, message: err.message };
  }
};

async function login(openid, event) {
  const familyRes = await db.collection('families').where({ openid }).get();

  if (familyRes.data.length > 0) {
    const family = familyRes.data[0];
    await db.collection('families').doc(family._id).update({
      data: { updatedAt: new Date() }
    });
    return { code: 0, openid, family, isNew: false };
  }

  // 新用户：自动创建家庭
  const family = {
    openid,
    name: '我的家庭',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const addRes = await db.collection('families').add({ data: family });
  const familyId = addRes._id;

  // 创建默认配置
  const defaults = {
    familyId,
    scoreMultipliers: { '3': 1.5, '2': 1.0, '1': 0.6 },
    updatedAt: new Date()
  };
  await db.collection('familyConfig').add({ data: defaults });

  // 创建默认大小奖池
  const smallItems = [
    { id: 's1', name: '5-15积分',   type: 'points',  pointsValue: { min: 5, max: 15 },  weight: 60, rarity: 'common',    icon: '⭐' },
    { id: 's2', name: '20-30积分',  type: 'points',  pointsValue: { min: 20, max: 30 }, weight: 25, rarity: 'rare',      icon: '🌟' },
    { id: 's3', name: '50积分+小零食', type: 'reward', pointsValue: 50, rewardTitle: '小零食一份', rewardDescription: '家长准备的小零食', weight: 10, rarity: 'epic', icon: '🍬' },
    { id: 's4', name: '100积分+特别奖励', type: 'reward', pointsValue: 100, rewardTitle: '特别奖励', rewardDescription: '可兑换一次特别活动', weight: 5, rarity: 'legendary', icon: '🎁' }
  ];

  const bigItems = [
    { id: 'b1', name: '30-60积分',    type: 'points',  pointsValue: { min: 30, max: 60 },   weight: 50, rarity: 'common',    icon: '⭐' },
    { id: 'b2', name: '80-120积分',   type: 'points',  pointsValue: { min: 80, max: 120 },  weight: 25, rarity: 'rare',      icon: '🌟' },
    { id: 'b3', name: '200积分+中奖励', type: 'reward', pointsValue: 200, rewardTitle: '中等奖励', rewardDescription: '如看动画片30分钟', weight: 15, rarity: 'epic', icon: '🎬' },
    { id: 'b4', name: '500积分+大奖励', type: 'reward', pointsValue: 500, rewardTitle: '豪华大奖', rewardDescription: '如去游乐园', weight: 10, rarity: 'legendary', icon: '🎪' }
  ];

  await db.collection('drawPools').add({
    data: { familyId, type: 'small', name: '小抽奖', cost: 20, isActive: true, items: smallItems, createdAt: new Date(), updatedAt: new Date() }
  });
  await db.collection('drawPools').add({
    data: { familyId, type: 'big', name: '大抽奖', cost: 80, isActive: true, items: bigItems, createdAt: new Date(), updatedAt: new Date() }
  });

  family._id = familyId;
  return { code: 0, openid, family, isNew: true };
}

async function getFamily(openid) {
  const familyRes = await db.collection('families').where({ openid }).get();
  if (familyRes.data.length === 0) {
    return { code: 0, family: null };
  }
  return { code: 0, family: familyRes.data[0] };
}
