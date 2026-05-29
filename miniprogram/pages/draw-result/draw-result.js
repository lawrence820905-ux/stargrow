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
  }
});
