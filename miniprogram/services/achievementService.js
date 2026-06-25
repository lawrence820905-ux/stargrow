const { callCloud } = require('../utils/cloudHelper');

function callAchievement(action, data = {}) {
  return callCloud('achievement', action, data);
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
