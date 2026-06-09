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
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
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
      const result = await completeTask(this.data.task._id, this.data.selectedScore);
      checkAndAward(this.data.task.childId).catch(err => console.error('成就检查失败:', err));
      wx.showToast({ title: `+${this.data.computedPoints} 积分!`, icon: 'success' });

      // 检查升级/里程碑庆祝
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];

      if (result.leveledUp) {
        // 升级庆祝
        setTimeout(() => {
          const confetti = currentPage.selectComponent('#confetti');
          if (confetti) confetti.show({ mode: 'levelup' });
        }, 500);
      }

      if (result.streakMilestone) {
        // 连续天数里程碑
        setTimeout(() => {
          wx.showToast({
            title: `🔥 连续${result.streakMilestone}天打卡！`,
            icon: 'none',
            duration: 2000
          });
        }, 1500);
      }

      setTimeout(() => wx.navigateBack(), result.leveledUp ? 2500 : 1000);
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  }
});
