const { callCloud } = require('../utils/cloudHelper');

function callObserve(action, data = {}) {
  return callCloud('observe', action, data);
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
