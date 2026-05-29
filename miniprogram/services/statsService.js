async function callStats(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'stats',
    data: { action, ...data }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result;
}

async function getChildOverview(childId) {
  return await callStats('getChildOverview', { childId });
}

async function getWeeklyChart(childId, weeks = 8) {
  return await callStats('getWeeklyChart', { childId, weeks });
}

async function getCategoryBreakdown(childId) {
  return await callStats('getCategoryBreakdown', { childId });
}

async function getLeaderboard() {
  return await callStats('getLeaderboard');
}

async function getPointHistory(childId, page = 1, pageSize = 20) {
  return await callStats('getPointHistory', { childId, page, pageSize });
}

module.exports = {
  getChildOverview,
  getWeeklyChart,
  getCategoryBreakdown,
  getLeaderboard,
  getPointHistory
};
