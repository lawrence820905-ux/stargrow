Page({
  data: {
    prizeType: 'points',
    prizeName: '',
    pointsAwarded: 0,
    rewardTitle: ''
  },

  onLoad(options) {
    this.setData({
      prizeType: options.prizeType || 'points',
      prizeName: decodeURIComponent(options.prizeName || ''),
      pointsAwarded: parseInt(options.pointsAwarded) || 0,
      rewardTitle: decodeURIComponent(options.rewardTitle || '')
    });

    const confetti = this.selectComponent('#confetti');
    if (confetti) confetti.show();
  },

  onDone() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    const prizeName = this.data.prizeName || '惊喜奖励';
    return {
      title: `我抽到了「${prizeName}」！`,
      path: '/pages/draw/draw'
    };
  },

  onShareTimeline() {
    const prizeName = this.data.prizeName || '惊喜奖励';
    return {
      title: `抽到了「${prizeName}」，来成长派克试试手气吧！`
    };
  }
});
