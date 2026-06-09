const { login, loadChildren, isLoggedIn, joinFamily } = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    loading: false,
    inviteCode: '',
    showJoin: false
  },

  onLoad() {
    if (isLoggedIn()) {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  onInviteInput(e) {
    const val = e.detail.value.toUpperCase();
    this.setData({ inviteCode: val, showJoin: val.length > 0 });
  },

  async onLogin() {
    this.setData({ loading: true });
    try {
      const { family, isNew } = await login();
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
  },

  async onJoinFamily() {
    const code = this.data.inviteCode.trim().toUpperCase();
    if (code.length < 6) {
      wx.showToast({ title: '请输入6位邀请码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const family = await joinFamily(code);
      app.setFamily(family);
      await loadChildren();
      wx.reLaunch({ url: '/pages/index/index' });
    } catch (err) {
      console.error('加入家庭失败:', err);
      wx.showToast({ title: err.message || '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});
