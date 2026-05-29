async function callAchievement(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'achievement',
    data: { action, ...data }
  });
  const result = res && res.result;
  if (!result || result.code !== 0) {
    throw new Error((result && result.message) || '服务器错误');
  }
  return result;
}

async function checkAndAward(childId) {
  return await callAchievement('checkAndAward', { childId });
}

async function getAchievements(childId) {
  return await callAchievement('getAchievements', { childId });
}

// Custom achievement CRUD
async function listCustomAchievements() {
  return await callAchievement('listCustom', {});
}

async function saveCustomAchievement(data) {
  return await callAchievement('saveCustom', { data });
}

async function deleteCustomAchievement(id) {
  return await callAchievement('deleteCustom', { id });
}

module.exports = {
  checkAndAward,
  getAchievements,
  listCustomAchievements,
  saveCustomAchievement,
  deleteCustomAchievement
};
