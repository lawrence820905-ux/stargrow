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
      case 'joinFamily':
        return await joinFamily(OPENID, event);
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

// 邀请码长度
const CODE_LEN = 6;

async function login(openid, event) {
  // 查找已有家庭：members 或旧数据 openid
  const familyRes = await db.collection('families')
    .where(_.or([{ members: openid }, { openid }]))
    .get();

  if (familyRes.data.length > 0) {
    const family = familyRes.data[0];
    // 迁移旧数据：如果只有 openid 没有 members，自动补 members 和 inviteCode
    const updates = { updatedAt: new Date() };
    if (!family.members) {
      updates.members = [family.openid || openid];
    }
    if (!family.inviteCode) {
      updates.inviteCode = genCode(family._id);
    }
    if (Object.keys(updates).length > 1) {
      await db.collection('families').doc(family._id).update({ data: updates });
      family.members = updates.members;
      family.inviteCode = updates.inviteCode;
    }
    return { code: 0, openid, family, isNew: false };
  }

  // 新用户：创建家庭
  const family = {
    openid,
    members: [openid],
    name: '我的家庭',
    inviteCode: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const addRes = await db.collection('families').add({ data: family });
  const familyId = addRes._id;
  family._id = familyId;
  family.inviteCode = genCode(familyId);
  await db.collection('families').doc(familyId).update({
    data: { inviteCode: family.inviteCode }
  });

  // 创建默认配置
  await db.collection('familyConfig').add({
    data: {
      familyId,
      scoreMultipliers: { '3': 1.5, '2': 1.0, '1': 0.6 },
      updatedAt: new Date()
    }
  });

  // 创建默认大小奖池
  const smallItems = [
    { id: 's1', name: '5-15积分',   type: 'points',  pointsValue: { min: 5, max: 15 },  rarity: 'common',    icon: '⭐' },
    { id: 's2', name: '20-30积分',  type: 'points',  pointsValue: { min: 20, max: 30 }, rarity: 'rare',      icon: '🌟' },
    { id: 's3', name: '50积分+小零食', type: 'reward', pointsValue: 50, rewardTitle: '小零食一份', rewardDescription: '家长准备的小零食', rarity: 'epic', icon: '🍬' },
    { id: 's4', name: '100积分+特别奖励', type: 'reward', pointsValue: 100, rewardTitle: '特别奖励', rewardDescription: '可兑换一次特别活动', rarity: 'legendary', icon: '🎁' }
  ];
  const bigItems = [
    { id: 'b1', name: '30-60积分',    type: 'points',  pointsValue: { min: 30, max: 60 },   rarity: 'common',    icon: '⭐' },
    { id: 'b2', name: '80-120积分',   type: 'points',  pointsValue: { min: 80, max: 120 },  rarity: 'rare',      icon: '🌟' },
    { id: 'b3', name: '200积分+中奖励', type: 'reward', pointsValue: 200, rewardTitle: '中等奖励', rewardDescription: '如看动画片30分钟', rarity: 'epic', icon: '🎬' },
    { id: 'b4', name: '500积分+大奖励', type: 'reward', pointsValue: 500, rewardTitle: '豪华大奖', rewardDescription: '如去游乐园', rarity: 'legendary', icon: '🎪' }
  ];
  await db.collection('drawPools').add({
    data: { familyId, type: 'small', name: '小宝箱', cost: 20, isActive: true, items: smallItems, createdAt: new Date(), updatedAt: new Date() }
  });
  await db.collection('drawPools').add({
    data: { familyId, type: 'big', name: '大宝箱', cost: 80, isActive: true, items: bigItems, createdAt: new Date(), updatedAt: new Date() }
  });

  return { code: 0, openid, family, isNew: true };
}

async function joinFamily(openid, event) {
  const { inviteCode } = event;
  if (!inviteCode || inviteCode.length !== CODE_LEN) {
    return { code: 400, message: '请输入6位邀请码' };
  }

  const familyRes = await db.collection('families').where({ inviteCode: inviteCode.toUpperCase() }).get();
  if (familyRes.data.length === 0) {
    return { code: 404, message: '邀请码无效，请检查后重试' };
  }

  const family = familyRes.data[0];
  const members = family.members || [family.openid].filter(Boolean);

  if (members.includes(openid)) {
    return { code: 400, message: '你已是该家庭的成员' };
  }

  members.push(openid);
  await db.collection('families').doc(family._id).update({
    data: { members, updatedAt: new Date() }
  });

  family.members = members;
  return { code: 0, family };
}

async function getFamily(openid) {
  const familyRes = await db.collection('families')
    .where(_.or([{ members: openid }, { openid }]))
    .get();

  const family = familyRes.data[0];
  if (!family) return { code: 0, family: null };

  // 迁移旧数据：如果没有 inviteCode，自动生成
  if (!family.inviteCode) {
    family.inviteCode = genCode(family._id);
    await db.collection('families').doc(family._id).update({
      data: { inviteCode: family.inviteCode, updatedAt: new Date() }
    });
  }
  // 迁移旧数据：如果没有 members 字段
  if (!family.members) {
    family.members = [family.openid || openid];
    await db.collection('families').doc(family._id).update({
      data: { members: family.members, updatedAt: new Date() }
    });
  }
  return { code: 0, family };
}

function genCode(familyId) {
  // 基于 familyId 生成 6 位字母数字码
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = 0;
  for (let i = 0; i < familyId.length; i++) {
    hash = ((hash << 5) - hash) + familyId.charCodeAt(i);
    hash |= 0;
  }
  let code = '';
  for (let i = 0; i < CODE_LEN; i++) {
    code += chars[Math.abs(hash + i * 7) % chars.length];
  }
  return code;
}
