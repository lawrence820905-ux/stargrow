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
