Page({
  data: {
    showFeedback: false,
    feedbackText: '',
    inviteCode: '',
    members: [],
    memberCount: 0
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
      // 邀请码为空，尝试刷新家庭数据
      this.refreshInviteCode();
      return;
    }
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      }
    });
  },

  async refreshInviteCode() {
    wx.showLoading({ title: '获取邀请码...' });
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
              wx.showToast({ title: '邀请码已复制', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '复制失败，请重试', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '暂无邀请码，请稍后重试', icon: 'none' });
        }
      } else {
        wx.hideLoading();
        wx.showToast({ title: '获取邀请码失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '获取邀请码失败', icon: 'none' });
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

  preventBubble() {},

  onShowFeedback() {
    this.setData({ showFeedback: true, feedbackText: '' });
  },

  onCloseFeedback() {
    this.setData({ showFeedback: false });
  },

  onFeedbackInput(e) {
    this.setData({ feedbackText: e.detail.value });
  },

  async onSubmitFeedback() {
    const text = this.data.feedbackText.trim();
    if (!text) {
      wx.showToast({ title: '请输入建议内容', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中...' });
    try {
      // 直接写入数据库，不依赖云函数，更可靠
      const db = wx.cloud.database();
      await db.collection('feedback').add({
        data: {
          content: text,
          createdAt: db.serverDate()
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '感谢您的建议！', icon: 'success' });
      this.setData({ showFeedback: false, feedbackText: '' });
    } catch (err) {
      wx.hideLoading();
      console.error('反馈提交失败:', err);
      // 如果直接写入也失败，尝试云函数兜底
      try {
        const res = await wx.cloud.callFunction({
          name: 'feedback',
          data: { action: 'submit', content: text }
        });
        if (res.result && res.result.code === 0) {
          wx.showToast({ title: '感谢您的建议！', icon: 'success' });
          this.setData({ showFeedback: false, feedbackText: '' });
          return;
        }
      } catch (e2) { /* 兜底也失败 */ }
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  }
});
