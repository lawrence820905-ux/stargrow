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

async function getMotivationInsight(childId) {
  return await callStats('getMotivationInsight', { childId });
}

async function getWeeklyComparison(childId) {
  return await callStats('getWeeklyComparison', { childId });
}

async function getFamilyGarden() {
  return await callStats('getFamilyGarden');
}

async function getSuperpower(childId) {
  return await callStats('getSuperpower', { childId });
}

async function cheerSibling(fromChildId, toChildId) {
  return await callStats('cheerSibling', { fromChildId, toChildId });
}

async function getPendingPromises() {
  return await callStats('getPendingPromises');
}

async function generateGrowthStory(childId) {
  return await callStats('generateGrowthStory', { childId });
}

async function getFamilyGoal() {
  return await callStats('getFamilyGoal', {});
}

async function setFamilyGoal(type, target, reward, title) {
  return await callStats('setFamilyGoal', { type, target, reward, title });
}

module.exports = {
  getChildOverview,
  getWeeklyChart,
  getCategoryBreakdown,
  getLeaderboard,
  getPointHistory,
  getMotivationInsight,
  getWeeklyComparison,
  getFamilyGarden,
  getSuperpower,
  cheerSibling,
  getPendingPromises,
  generateGrowthStory,
  getFamilyGoal,
  setFamilyGoal
};
