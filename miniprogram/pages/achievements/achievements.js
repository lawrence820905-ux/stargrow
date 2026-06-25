const { getAchievements } = require('../../services/achievementService');
const { getChildren, getActiveChild } = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    children: [],
    activeChildId: '',
    earned: [],
    locked: [],
    allBadges: [],
    total: 0
  },

  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 刷新孩子列表，避免缓存过期
    const { loadChildren } = require('../../utils/auth');
    try { await loadChildren(); } catch (e) { /* ignore */ }
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id });
      await this.loadData(activeChild._id);
    }
  },

  async loadData(childId) {
    try {
      const result = await getAchievements(childId);
      const all = [...result.earned, ...result.locked];
      this.setData({
        earned: result.earned,
        locked: result.locked,
        allBadges: all,
        total: result.total
      });
    } catch (e) { /* ignore */ }
  },

  onShareAppMessage() {
    return {
      title: '看看孩子获得了哪些成就徽章！',
      path: '/pages/achievements/achievements'
    };
  },

  onShareTimeline() {
    return {
      title: '成长派克 - 孩子成就墙'
    };
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    this.setData({ activeChildId: childId });
    this.loadData(childId);
  }
});
