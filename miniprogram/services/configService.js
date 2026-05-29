async function callConfig(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'config',
    data: { action, ...data }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result;
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
