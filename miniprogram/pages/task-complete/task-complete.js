const { getTask, completeTask } = require('../../services/taskService');
const { checkAndAward } = require('../../services/achievementService');
const { getConfig } = require('../../services/configService');
const { getAgeGroup } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    task: {},
    selectedScore: 0,
    multiplier: 1.0,
    computedPoints: 0,
    multipliers: { '3': 1.5, '2': 1.2, '1': 1.0 },
    ageGroup: 'child',
    conversationPrompt: '',
    showReflection: false,
    reflectionQuestion: '',
    reflectionOptions: [],
    selectedReflection: '',
    isAlreadyCompleted: false,
    alreadyCompletedMsg: ''
  },

  async onLoad(options) {
    // 随机选择亲子对话引导
    const prompts = [
      '💬 和孩子聊聊：今天做任务时最开心的是什么？',
      '💬 问问孩子：这次任务中哪个部分最有挑战？',
      '💬 和孩子分享：你注意到TA今天哪里做得特别棒？',
      '💬 聊聊看：下次做这个任务，有什么想改进的地方？',
      '💬 问问孩子：完成任务后的感觉怎么样？',
      '💬 和孩子讨论：这个任务让你学到了什么新东西？'
    ];
    const conversationPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    try {
      const result = await getTask(options.taskId);
      const isAlreadyCompleted = result.task.status === 'completed';
      this.setData({
        task: result.task,
        conversationPrompt,
        isAlreadyCompleted,
        alreadyCompletedMsg: '该任务已经被另一位家长完成啦~'
      });

      // 获取孩子年龄组
      const child = app.getActiveChild();
      if (child && child.birthYear) {
        const ag = getAgeGroup(child.birthYear);
        this.setData({ ageGroup: ag.group });
      }

      const configRes = await getConfig();
      this.setData({ multipliers: configRes.config.scoreMultipliers });
    } catch (e) {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  onScoreChange(e) {
    if (this.data.isAlreadyCompleted) return;
    const { score } = e.detail;
    const multiplier = this.data.multipliers[String(score)] || 1.0;

    // 随机选择一个反思问题
    const reflections = [
      { q: '这次任务最难的部分是什么？', opts: ['坚持做完', '开始第一步', '中间有点无聊', '需要帮忙', '其他'] },
      { q: '你是怎么克服困难的？', opts: ['自己想办法', '请教了家长', '休息了一下继续', '换了个方法', '其他'] },
      { q: '下次做这个任务，你想改进什么？', opts: ['做得更快', '做得更好', '更有趣', '更有耐心', '其他'] },
      { q: '做这个任务时，你感觉怎么样？', opts: ['很开心', '有点难', '很专注', '很轻松', '其他'] }
    ];
    const reflection = reflections[Math.floor(Math.random() * reflections.length)];

    this.setData({
      selectedScore: score,
      multiplier,
      computedPoints: Math.round(this.data.task.basePoints * multiplier),
      showReflection: true,
      reflectionQuestion: reflection.q,
      reflectionOptions: reflection.opts,
      selectedReflection: ''
    });
  },

  onSelectReflection(e) {
    const { option } = e.currentTarget.dataset;
    this.setData({ selectedReflection: option });
  },

  onSkipReflection() {
    this.setData({ showReflection: false, selectedReflection: '' });
  },

  async onConfirm() {
    if (this.data.isAlreadyCompleted) {
      wx.showToast({ title: this.data.alreadyCompletedMsg, icon: 'none' });
      return;
    }
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
