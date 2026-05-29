const { getChildOverview, getCategoryBreakdown, getLeaderboard, getWeeklyChart } = require('../../services/statsService');
const { getChildren, getActiveChild } = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    navBarTop: 88,
    children: [],
    activeChildId: '',
    overview: {},
    breakdown: {},
    leaderboard: [],
    chartLabels: [],
    chartCompleted: [],
    chartPoints: [],
    maxCompleted: 0,
    maxCat: 0
  },

  async onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ navBarTop: (sysInfo.statusBarHeight || 20) + 88 });
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id });
      await this.loadData(activeChild._id);
    }
    await this.loadLeaderboard();
  },

  async loadData(childId) {
    try {
      const [overview, breakdown, chart] = await Promise.all([
        getChildOverview(childId),
        getCategoryBreakdown(childId),
        getWeeklyChart(childId, 8)
      ]);
      const maxCompleted = Math.max(...chart.completedData, 1);
      const b = breakdown.breakdown;
      const maxCat = Math.max(b.sport || 0, b.life || 0, b.study || 0, 1);
      this.setData({
        overview: overview.overview,
        breakdown: b,
        chartLabels: chart.labels,
        chartCompleted: chart.completedData,
        chartPoints: chart.pointsData,
        maxCompleted,
        maxCat
      });
    } catch (e) { /* ignore */ }
  },

  async loadLeaderboard() {
    try {
      const result = await getLeaderboard();
      this.setData({ leaderboard: result.rankings || [] });
    } catch (e) { /* ignore */ }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    this.setData({ activeChildId: childId });
    this.loadData(childId);
  }
});
