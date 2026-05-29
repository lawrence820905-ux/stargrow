const { getTask, completeTask } = require('../../services/taskService');
const { checkAndAward } = require('../../services/achievementService');
const { getConfig } = require('../../services/configService');

Page({
  data: {
    task: {},
    selectedScore: 0,
    multiplier: 1.0,
    computedPoints: 0,
    multipliers: { '3': 1.5, '2': 1.0, '1': 0.6 }
  },

  async onLoad(options) {
    try {
      const result = await getTask(options.taskId);
      this.setData({ task: result.task });
      const configRes = await getConfig();
      this.setData({ multipliers: configRes.config.scoreMultipliers });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onScoreChange(e) {
    const { score } = e.detail;
    const multiplier = this.data.multipliers[String(score)] || 1.0;
    this.setData({
      selectedScore: score,
      multiplier,
      computedPoints: Math.round(this.data.task.basePoints * multiplier)
    });
  },

  async onConfirm() {
    try {
      await completeTask(this.data.task._id, this.data.selectedScore);
      checkAndAward(this.data.task.childId).catch(() => {});
      wx.showToast({ title: `+${this.data.computedPoints} 积分!`, icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  }
});
