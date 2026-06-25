const { callCloud } = require('../utils/cloudHelper');

function callConfig(action, data = {}) {
  return callCloud('config', action, data);
}

async function getConfig() {
  return await callConfig('get');
}

async function updateConfig(scoreMultipliers) {
  return await callConfig('update', { scoreMultipliers });
}

module.exports = {
  getConfig,
  updateConfig
};
