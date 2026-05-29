const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const family = await getFamilyByOpenid(OPENID);
    if (!family) return { code: 401, message: '未找到家庭' };

    switch (action) {
      case 'getPools':      return await getPools(family._id);
      case 'savePool':      return await savePool(family._id, event);
      case 'draw':          return await doDraw(family._id, event);
      case 'batchDraw':     return await batchDraw(family._id, event);
      case 'getRecords':    return await getRecords(family._id, event);
      case 'fulfillReward': return await fulfillReward(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('draw error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where({ openid }).get();
  return res.data[0] || null;
}

async function getPools(familyId) {
  const res = await db.collection('drawPools')
    .where({ familyId, isActive: true })
    .get();

  const smallPool = res.data.find(p => p.type === 'small') || null;
  const bigPool = res.data.find(p => p.type === 'big') || null;

  return { code: 0, smallPool, bigPool };
}

async function savePool(familyId, event) {
  const { type, name, cost, items } = event;

  const existing = await db.collection('drawPools')
    .where({ familyId, type })
    .get();

  const data = {
    name: name || (type === 'small' ? '小抽奖' : '大抽奖'),
    cost: cost || (type === 'small' ? 20 : 80),
    items: items || [],
    updatedAt: new Date()
  };

  if (existing.data.length > 0) {
    await db.collection('drawPools').doc(existing.data[0]._id).update({ data });
  } else {
    data.familyId = familyId;
    data.type = type;
    data.isActive = true;
    data.createdAt = new Date();
    await db.collection('drawPools').add({ data });
  }

  const updated = await db.collection('drawPools')
    .where({ familyId, type })
    .get();

  return { code: 0, pool: updated.data[0] };
}

async function doDraw(familyId, event) {
  const { childId, poolType } = event;

  // 检查奖池
  const poolRes = await db.collection('drawPools')
    .where({ familyId, type: poolType, isActive: true })
    .get();
  if (poolRes.data.length === 0) return { code: 400, message: '奖池不存在' };

  const pool = poolRes.data[0];
  if (!pool.items || pool.items.length === 0) return { code: 400, message: '奖池为空' };

  // 检查孩子
  const childRes = await db.collection('children').doc(childId).get();
  const child = childRes.data;
  if (!child) return { code: 404, message: '孩子不存在' };

  // 检查积分
  if (child.currentPoints < pool.cost) return { code: 400, message: '积分不足' };

  // 加权随机
  const prize = weightedRandom(pool.items);
  if (!prize) return { code: 500, message: '抽奖失败' };

  // 计算获得积分
  let pointsAwarded = 0;
  if (prize.type === 'points') {
    if (typeof prize.pointsValue === 'object' && prize.pointsValue.min !== undefined) {
      pointsAwarded = randBetween(prize.pointsValue.min, prize.pointsValue.max);
    } else {
      pointsAwarded = prize.pointsValue || 0;
    }
  }

  // 净积分变化：消耗 - 获得
  const newCurrent = child.currentPoints - pool.cost + pointsAwarded;

  // 更新孩子积分
  await db.collection('children').doc(childId).update({
    data: {
      currentPoints: newCurrent,
      totalDraws: (child.totalDraws || 0) + 1
    }
  });

  // 积分流水：消耗
  await db.collection('pointRecords').add({
    data: {
      familyId,
      childId,
      amount: -pool.cost,
      type: 'draw_cost',
      relatedTaskId: null,
      relatedDrawId: null,
      balanceAfter: child.currentPoints - pool.cost,
      note: `${poolType === 'small' ? '小' : '大'}抽奖消耗`,
      createdAt: new Date()
    }
  });

  // 积分流水：获得（如有）
  if (pointsAwarded > 0) {
    const drawCostRecord = await db.collection('pointRecords')
      .where({ childId, type: 'draw_cost' })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    const relatedDrawId = drawCostRecord.data[0] ? drawCostRecord.data[0]._id : null;

    await db.collection('pointRecords').add({
      data: {
        familyId,
        childId,
        amount: pointsAwarded,
        type: 'draw_reward',
        relatedTaskId: null,
        relatedDrawId,
        balanceAfter: newCurrent,
        note: `抽中: ${prize.name}`,
        createdAt: new Date()
      }
    });
  }

  // 抽奖记录
  const record = {
    familyId,
    childId,
    poolId: pool._id,
    poolType,
    pointsSpent: pool.cost,
    prizeName: prize.name,
    prizeType: prize.type,
    pointsAwarded,
    rewardTitle: prize.rewardTitle || null,
    isFulfilled: false,
    fulfilledAt: null,
    createdAt: new Date()
  };
  const recRes = await db.collection('drawRecords').add({ data: record });
  record._id = recRes._id;

  // 检查成就（如有传说奖品）
  if (prize.rarity === 'legendary') {
    try {
      await cloud.callFunction({
        name: 'achievement',
        data: { action: 'checkAndAward', childId }
      });
    } catch (e) { /* ignore */ }
  }

  return { code: 0, record, newCurrent };
}

async function batchDraw(familyId, event) {
  const { childId, poolType, count } = event;
  const results = [];
  for (let i = 0; i < Math.min(count, 10); i++) {
    const res = await doDraw(familyId, { childId, poolType });
    if (res.code === 0) {
      results.push(res.record);
    } else {
      break;
    }
  }
  return { code: 0, records: results };
}

async function getRecords(familyId, event) {
  const { childId, page = 1, pageSize = 20 } = event;
  const conditions = { familyId };
  if (childId) conditions.childId = childId;

  const totalRes = await db.collection('drawRecords').where(conditions).count();
  const res = await db.collection('drawRecords')
    .where(conditions)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  // 填充孩子名称
  const childIds = [...new Set(res.data.map(r => r.childId))];
  const childrenRes = await db.collection('children')
    .where({ _id: db.command.in(childIds) })
    .get();
  const childMap = {};
  childrenRes.data.forEach(c => { childMap[c._id] = c.name; });

  const records = res.data.map(r => ({ ...r, childName: childMap[r.childId] || '' }));

  return { code: 0, records, total: totalRes.total };
}

async function fulfillReward(familyId, event) {
  await db.collection('drawRecords').doc(event.recordId).update({
    data: { isFulfilled: true, fulfilledAt: new Date() }
  });
  const record = await db.collection('drawRecords').doc(event.recordId).get();
  return { code: 0, record: record.data };
}

function weightedRandom(items) {
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
