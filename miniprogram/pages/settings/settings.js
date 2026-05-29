Page({
  data: {
    showFeedback: false,
    feedbackText: ''
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
    try {
      await wx.cloud.callFunction({
        name: 'feedback',
        data: { action: 'submit', content: text }
      });
      wx.showToast({ title: '感谢您的建议！', icon: 'success' });
      this.setData({ showFeedback: false, feedbackText: '' });
    } catch (err) {
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  }
});
