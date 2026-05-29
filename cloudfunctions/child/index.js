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
      case 'create': return await create(family._id, event);
      case 'update': return await updateChild(family._id, event);
      case 'remove': return await removeChild(family._id, event);
      case 'list':   return await list(family._id);
      case 'get':    return await get(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('child error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where({ openid }).get();
  return res.data[0] || null;
}

async function create(familyId, event) {
  const child = {
    familyId,
    name: event.name || '新孩子',
    avatarUrl: event.avatarUrl || '',
    totalPointsEarned: 0,
    currentPoints: 0,
    level: 1,
    streakDays: 0,
    lastActiveDate: '',
    totalTasksCompleted: 0,
    totalDraws: 0,
    createdAt: new Date()
  };
  const res = await db.collection('children').add({ data: child });
  child._id = res._id;
  return { code: 0, child };
}

async function updateChild(familyId, event) {
  const { childId, name, avatarUrl } = event;
  const data = { updatedAt: new Date() };
  if (name !== undefined) data.name = name;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

  await db.collection('children').doc(childId).update({ data });
  const child = await db.collection('children').doc(childId).get();
  return { code: 0, child: child.data };
}

async function removeChild(familyId, event) {
  const { childId } = event;
  await db.collection('children').doc(childId).remove();
  return { code: 0, success: true };
}

async function list(familyId) {
  const res = await db.collection('children')
    .where({ familyId })
    .orderBy('createdAt', 'asc')
    .get();
  return { code: 0, children: res.data };
}

async function get(familyId, event) {
  const { childId } = event;
  const res = await db.collection('children').doc(childId).get();
  return { code: 0, child: res.data };
}
