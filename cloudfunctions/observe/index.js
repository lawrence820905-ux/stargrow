const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const family = await getFamilyByOpenid(OPENID);
    if (!family) return { code: 401, message: '未找到家庭' };

    switch (action) {
      case 'add':    return await addObservation(family._id, event);
      case 'list':   return await listObservations(event);
      case 'delete': return await deleteObservation(event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('observe error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where(_.or([{ members: openid }, { openid }])).get();
  return res.data[0] || null;
}

async function addObservation(familyId, event) {
  const { childId, content, mood, tags, bonusPoints } = event;

  if (!childId || !content || !content.trim()) {
    return { code: 400, message: '孩子和内容不能为空' };
  }

  const bp = Math.max(0, Math.min(20, parseInt(bonusPoints) || 0));

  const data = {
    familyId,
    childId,
    content: content.trim(),
    mood: mood || '',
    tags: tags || [],
    bonusPoints: bp,
    createdAt: new Date()
  };

  const res = await db.collection('observations').add({ data });
  data._id = res._id;

  // 如果有 bonus 积分，更新孩子积分
  if (bp > 0) {
    const child = await db.collection('children').doc(childId).get();
    const newPoints = (child.data.currentPoints || 0) + bp;
    const newTotal = (child.data.totalPointsEarned || 0) + bp;
    await db.collection('children').doc(childId).update({
      data: { currentPoints: newPoints, totalPointsEarned: newTotal }
    });

    await db.collection('pointRecords').add({
      data: {
        familyId,
        childId,
        amount: bp,
        type: 'observation_bonus',
        balanceAfter: newPoints,
        note: `闪亮时刻奖励: ${content.trim().substring(0, 30)}`,
        createdAt: new Date()
      }
    });
    data.bonusAwarded = bp;
  }

  return { code: 0, observation: data };
}

async function listObservations(event) {
  const { childId, page = 1, pageSize = 20 } = event;
  if (!childId) return { code: 400, message: '缺少孩子ID' };

  const totalRes = await db.collection('observations')
    .where({ childId })
    .count();

  const res = await db.collection('observations')
    .where({ childId })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  return { code: 0, observations: res.data, total: totalRes.total };
}

async function deleteObservation(event) {
  const { id } = event;
  await db.collection('observations').doc(id).remove();
  return { code: 0 };
}
