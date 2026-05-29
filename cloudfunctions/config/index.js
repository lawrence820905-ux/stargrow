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
      case 'get':    return await getConfig(family._id);
      case 'update': return await updateConfig(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('config error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where({ openid }).get();
  return res.data[0] || null;
}

async function getConfig(familyId) {
  const res = await db.collection('familyConfig').where({ familyId }).get();
  if (res.data.length === 0) {
    const defaults = {
      familyId,
      scoreMultipliers: { '3': 1.5, '2': 1.0, '1': 0.6 },
      updatedAt: new Date()
    };
    const addRes = await db.collection('familyConfig').add({ data: defaults });
    defaults._id = addRes._id;
    return { code: 0, config: defaults };
  }
  const config = res.data[0];
  if (config.scoreMultipliers && config.scoreMultipliers['5'] !== undefined) {
    config.scoreMultipliers = { '3': 1.5, '2': 1.0, '1': 0.6 };
    await db.collection('familyConfig').doc(config._id).update({
      data: { scoreMultipliers: config.scoreMultipliers, updatedAt: new Date() }
    });
  }
  return { code: 0, config };
}

async function updateConfig(familyId, event) {
  const { scoreMultipliers } = event;
  const data = { updatedAt: new Date() };
  if (scoreMultipliers) data.scoreMultipliers = scoreMultipliers;

  const configRes = await db.collection('familyConfig').where({ familyId }).get();
  if (configRes.data.length > 0) {
    await db.collection('familyConfig').doc(configRes.data[0]._id).update({ data });
  } else {
    await db.collection('familyConfig').add({ data: { familyId, ...data } });
  }

  const updated = await db.collection('familyConfig').where({ familyId }).get();
  return { code: 0, config: updated.data[0] };
}
