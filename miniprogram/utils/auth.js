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
          const { openid, family, isNew } = result.result;
          app.setUserInfo({ openid });
          if (family) {
            app.setFamily(family);
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
  loadChildren,
  joinFamily
};
