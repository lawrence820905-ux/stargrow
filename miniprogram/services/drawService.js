const { callCloud } = require('../utils/cloudHelper');

function callDraw(action, data = {}) {
  return callCloud('draw', action, data);
}

async function getPools(childId) {
  return await callDraw('getPools', { childId });
}

async function savePool(type, name, cost, items, dailyLimit) {
  return await callDraw('savePool', { type, name, cost, items, dailyLimit });
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

async function getTodayDrawCount(childId) {
  return await callDraw('getTodayDrawCount', { childId });
}

module.exports = {
  getPools,
  savePool,
  doDraw,
  batchDraw,
  getRecords,
  fulfillReward,
  getTodayDrawCount
};
