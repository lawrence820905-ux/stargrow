const app = getApp();

Page({
  data: {
    inviteCode: '',
    joinCode: '',
    members: [],
    memberCount: 0,
    showFeedback: false,
    feedbackType: 'bug',
    feedbackText: ''
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    this.loadFamilyInfo();
  },

  async loadFamilyInfo() {
    let family = getApp().globalData.family;
    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: { action: 'getFamily' }
      });
      if (res.result && res.result.code === 0 && res.result.family) {
        family = res.result.family;
        getApp().setFamily(family);
      }
    } catch (e) { /* 静默失败 */ }

    if (family) {
      const rawMembers = family.members || (family.openid ? [family.openid] : []);
      const members = rawMembers.map((m, i) => ({
        openid: m,
        nickname: `家长${i + 1}`,
        role: '成员'
      }));
      this.setData({
        inviteCode: family.inviteCode || '',
        members,
        memberCount: members.length
      });
    }
  },

  onCopyInvite() {
    const code = this.data.inviteCode;
    if (!code) {
      // 家庭码为空，尝试刷新家庭数据
      this.refreshInviteCode();
      return;
    }
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '家庭码已复制', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      }
    });
  },

  async refreshInviteCode() {
    wx.showLoading({ title: '获取家庭码...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: { action: 'getFamily' }
      });
      if (res.result && res.result.code === 0 && res.result.family) {
        const family = res.result.family;
        getApp().setFamily(family);
        const code = family.inviteCode || '';
        this.setData({ inviteCode: code });
        wx.hideLoading();
        if (code) {
          wx.setClipboardData({
            data: code,
            success: () => {
              wx.showToast({ title: '家庭码已复制', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '复制失败，请重试', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '暂无家庭码，请稍后重试', icon: 'none' });
        }
      } else {
        wx.hideLoading();
        wx.showToast({ title: '获取家庭码失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '获取家庭码失败', icon: 'none' });
    }
  },

  onJoinInput(e) {
    this.setData({ joinCode: e.detail.value.toUpperCase() });
  },

  async onJoinFamily() {
    const code = this.data.joinCode.trim().toUpperCase();
    if (code.length < 6) {
      wx.showToast({ title: '请输入6位家庭码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加入中...' });
    try {
      const { joinFamily } = require('../../utils/auth');
      const family = await joinFamily(code);
      app.setFamily(family);
      await require('../../utils/auth').loadChildren();
      wx.hideLoading();
      wx.showToast({ title: '已切换到新家庭！', icon: 'success' });
      this.setData({ joinCode: '' });
      this.loadFamilyInfo();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '加入失败，请检查家庭码', icon: 'none' });
    }
  },

  onGoChildManage() {
    wx.navigateTo({ url: '/pages/child-manage/child-manage' });
  },

  onGoDrawConfig() {
    wx.navigateTo({ url: '/pages/draw-config/draw-config' });
  },

  onGoStats() {
    wx.navigateTo({ url: '/pages/stats/stats' });
  },

  onGoAchievementConfig() {
    wx.navigateTo({ url: '/pages/achievement-config/achievement-config' });
  },

  onGoPointLog() {
    wx.navigateTo({ url: '/pages/point-log/point-log' });
  },

  onGoExchangeLog() {
    wx.navigateTo({ url: '/pages/exchange-log/exchange-log' });
  },

  onGoShopConfig() {
    wx.navigateTo({ url: '/pages/shop-config/shop-config' });
  },

  onShareAppMessage() {
    return {
      title: '成长派克 - 孩子激励成长好帮手',
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: '成长派克 - 孩子激励成长好帮手'
    };
  },

  preventBubble() {},

  // 反馈相关
  onShowFeedback() {
    this.setData({ showFeedback: true, feedbackType: 'bug', feedbackText: '' });
  },
  onCloseFeedback() {
    this.setData({ showFeedback: false });
  },
  onSelectFeedbackType(e) {
    this.setData({ feedbackType: e.currentTarget.dataset.type });
  },
  onFeedbackInput(e) {
    this.setData({ feedbackText: e.detail.value });
  },
  async onSubmitFeedback() {
    const text = this.data.feedbackText.trim();
    const type = this.data.feedbackType;
    if (!text) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中...' });
    try {
      const db = wx.cloud.database();
      await db.collection('feedback').add({
        data: {
          type,
          typeName: type === 'bug' ? '功能异常' : '产品建议',
          content: text,
          createdAt: db.serverDate()
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '感谢反馈！', icon: 'success' });
      this.setData({ showFeedback: false, feedbackText: '' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },
});
