const app = getApp();

function getUserInfo() {
  return app.globalData.userInfo;
}

function getFamily() {
  return app.globalData.family;
}

function getFamilyId() {
  return app.globalData.family ? app.globalData.family._id : null;
}

function getChildren() {
  return app.globalData.children || [];
}

function getActiveChild() {
  return app.getActiveChild();
}

function getActiveChildId() {
  const child = app.getActiveChild();
  return child ? child._id : null;
}

function isLoggedIn() {
  return !!app.globalData.userInfo;
}

async function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        try {
          const result = await wx.cloud.callFunction({
            name: 'user',
            data: { action: 'login', code: res.code }
          });
          // 检查云函数返回的业务状态码
          if (result.result.code !== 0) {
            reject(new Error(result.result.message || '登录失败'));
            return;
          }
          const { openid, family, isNew } = result.result;
          app.setUserInfo({ openid });
          if (family) {
            app.setFamily(family);
          } else {
            // 家庭不存在且未创建成功，清除旧数据
            app.setFamily(null);
            wx.removeStorageSync('family');
          }
          resolve({ openid, family, isNew });
        } catch (err) {
          reject(err);
        }
      },
      fail: reject
    });
  });
}

// 确保家庭存在：如果云端没有家庭，自动创建一个
// 用于恢复"本地有 userInfo 但云端无 family"的脏数据场景
async function ensureFamily() {
  try {
    const res = await wx.cloud.callFunction({
      name: 'user',
      data: { action: 'login' }
    });
    if (res.result.code !== 0) {
      console.error('ensureFamily 失败:', res.result.message);
      return null;
    }
    const { family } = res.result;
    if (family) {
      app.setFamily(family);
      console.log('ensureFamily: 家庭已恢复');
    }
    return family;
  } catch (err) {
    console.error('ensureFamily 异常:', err);
    return null;
  }
}

async function loadChildren() {
  try {
    const res = await wx.cloud.callFunction({
      name: 'child',
      data: { action: 'list' }
    });
    const children = res.result.children || [];
    app.setChildren(children);
    return children;
  } catch (err) {
    console.error('加载孩子列表失败:', err);
    return [];
  }
}

async function joinFamily(inviteCode) {
  const res = await wx.cloud.callFunction({
    name: 'user',
    data: { action: 'joinFamily', inviteCode }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result.family;
}

module.exports = {
  getUserInfo,
  getFamily,
  getFamilyId,
  getChildren,
  getActiveChild,
  getActiveChildId,
  isLoggedIn,
  login,
  ensureFamily,
  loadChildren,
  joinFamily
};
