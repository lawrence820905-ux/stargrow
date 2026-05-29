const { login, loadChildren, isLoggedIn } = require('../../utils/auth');
const app = getApp();

Page({
  data: { loading: false },

  onLoad() {
    if (isLoggedIn()) {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  async onLogin() {
    this.setData({ loading: true });
    try {
      const { openid, family, isNew } = await login();
      if (family) app.setFamily(family);
      await loadChildren();

      if (isNew) {
        wx.reLaunch({ url: '/pages/index/index' });
      } else {
        wx.reLaunch({ url: '/pages/index/index' });
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});
