async function callObserve(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'observe',
    data: { action, ...data }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result;
}

async function addObservation(childId, content, mood = '', tags = [], bonusPoints = 0) {
  return await callObserve('add', { childId, content, mood, tags, bonusPoints });
}

async function listObservations(childId, page = 1, pageSize = 20) {
  return await callObserve('list', { childId, page, pageSize });
}

async function deleteObservation(id) {
  return await callObserve('delete', { id });
}

module.exports = {
  addObservation,
  listObservations,
  deleteObservation
};
