/**
 * 云函数调用包装器
 * 自动处理"未找到家庭"(401)错误：尝试恢复家庭后重试一次
 */

async function callCloud(name, action, data = {}) {
  const res = await wx.cloud.callFunction({
    name,
    data: { action, ...data }
  });

  if (res.result.code === 0) return res.result;

  // 如果是"未找到家庭"错误，尝试自动恢复
  if (res.result.code === 401) {
    console.warn(`[${name}/${action}] 云端未找到家庭，尝试自动恢复…`);
    const { ensureFamily } = require('./auth');
    const family = await ensureFamily();
    if (family) {
      console.log(`[${name}/${action}] 家庭恢复成功，重试操作`);
      const retryRes = await wx.cloud.callFunction({
        name,
        data: { action, ...data }
      });
      if (retryRes.result.code !== 0) {
        throw new Error(retryRes.result.message);
      }
      return retryRes.result;
    }
    throw new Error('未找到家庭，请退出后重新登录');
  }

  throw new Error(res.result.message);
}

module.exports = { callCloud };
