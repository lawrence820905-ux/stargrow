async function callDraw(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'draw',
    data: { action, ...data }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result;
}

async function getPools() {
  return await callDraw('getPools');
}

async function savePool(type, name, cost, items) {
  return await callDraw('savePool', { type, name, cost, items });
}

async function doDraw(childId, poolType) {
  return await callDraw('draw', { childId, poolType });
}

async function batchDraw(childId, poolType, count) {
  return await callDraw('batchDraw', { childId, poolType, count });
}

async function getRecords(childId, page = 1, pageSize = 20) {
  return await callDraw('getRecords', { childId, page, pageSize });
}

async function fulfillReward(recordId) {
  return await callDraw('fulfillReward', { recordId });
}

module.exports = {
  getPools,
  savePool,
  doDraw,
  batchDraw,
  getRecords,
  fulfillReward
};
