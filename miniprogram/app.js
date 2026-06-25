const theme = require('./config/theme');
const defaults = require('./config/defaults');

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'cloud1-d7gcm0qoo4d352256',
      traceUser: true
    });

    this.loadGlobalData();
    this.recoverFamilyIfNeeded();
  },

  // 如果本地有 userInfo 但家庭缺失，尝试从云端恢复
  async recoverFamilyIfNeeded() {
    if (!this.globalData.userInfo) return;
    if (this.globalData.family) return;

    console.log('检测到 userInfo 存在但 family 缺失，尝试从云端恢复…');
    try {
      const { ensureFamily } = require('./utils/auth');
      const family = await ensureFamily();
      if (family) {
        console.log('家庭恢复成功:', family._id);
        // 恢复成功后刷新孩子列表
        const { loadChildren } = require('./utils/auth');
        await loadChildren();
      } else {
        console.warn('家庭恢复失败，将在需要时重新登录');
      }
    } catch (err) {
      console.error('家庭恢复异常:', err);
    }
  },

  loadGlobalData: function () {
    const userInfo = wx.getStorageSync('userInfo');
    const family = wx.getStorageSync('family');
    const children = wx.getStorageSync('children') || [];
    const activeChildId = wx.getStorageSync('activeChildId') || '';

    this.globalData = {
      userInfo: userInfo || null,
      family: family || null,
      children: children,
      activeChildId: activeChildId,
      theme: theme,
      defaults: defaults
    };
  },

  setUserInfo: function (info) {
    this.globalData.userInfo = info;
    wx.setStorageSync('userInfo', info);
  },

  setFamily: function (family) {
    this.globalData.family = family;
    wx.setStorageSync('family', family);
  },

  setChildren: function (children) {
    this.globalData.children = children;
    wx.setStorageSync('children', children);
  },

  setActiveChild: function (childId) {
    this.globalData.activeChildId = childId;
    wx.setStorageSync('activeChildId', childId);
  },

  getActiveChild: function () {
    const children = this.globalData.children;
    if (!children.length) return null;
    if (this.globalData.activeChildId) {
      return children.find(c => c._id === this.globalData.activeChildId) || children[0];
    }
    return children[0];
  },

  globalData: {
    userInfo: null,
    family: null,
    children: [],
    activeChildId: '',
    theme: theme,
    defaults: defaults
  }
});
