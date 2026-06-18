const { login, loadChildren } = require('../utils/auth');
const app = getApp();

async function callChild(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'child',
    data: { action, ...data }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result;
}

async function createChild(name, avatarUrl, age, birthYear) {
  const result = await callChild('create', { name, avatarUrl, age, birthYear });
  await refreshChildren();
  return result.child;
}

async function updateChild(childId, name, avatarUrl, age, birthYear) {
  const result = await callChild('update', { childId, name, avatarUrl, age, birthYear });
  await refreshChildren();
  return result.child;
}

async function removeChild(childId) {
  await callChild('remove', { childId });
  const children = app.globalData.children;
  if (app.globalData.activeChildId === childId) {
    const remaining = children.filter(c => c._id !== childId);
    app.setActiveChild(remaining.length > 0 ? remaining[0]._id : '');
  }
  await refreshChildren();
}

async function getChildren() {
  return await callChild('list');
}

async function refreshChildren() {
  const result = await getChildren();
  app.setChildren(result.children);
  return result.children;
}

module.exports = {
  createChild,
  updateChild,
  removeChild,
  getChildren,
  refreshChildren
};
