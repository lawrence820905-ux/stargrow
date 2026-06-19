const { getChildOverview, getCategoryBreakdown, getWeeklyChart, getWeeklyComparison, getSuperpower, getFamilyGoal, setFamilyGoal } = require('../../services/statsService');
const { getChildren, getActiveChild } = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    children: [],
    activeChildId: '',
    overview: {},
    breakdown: {},
    familyGoal: null,
    superpower: null,
    chartLabels: [],
    chartCompleted: [],
    chartPoints: [],
    maxCompleted: 0,
    maxCat: 0,
    comparison: null
  },

  async onLoad() {
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id });
      await this.loadData(activeChild._id);
    }
    await this.loadGoal();
  },

  async loadData(childId) {
    try {
      const [overview, breakdown, chart, comparison] = await Promise.all([
        getChildOverview(childId),
        getCategoryBreakdown(childId),
        getWeeklyChart(childId, 8),
        getWeeklyComparison(childId)
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
        maxCat,
        comparison: comparison.comparison || null
      });
    } catch (e) { /* ignore */ }
  },

  async loadGoal() {
    try {
      const goalRes = await getFamilyGoal();
      this.setData({ familyGoal: goalRes.goal || null });
    } catch (e) { /* ignore */ }
    if (this.data.activeChildId) {
      this.loadSuperpower(this.data.activeChildId);
    }
  },

  async onSetFamilyGoal(e) {
    const { type, target, reward, title } = e.currentTarget.dataset;
    try {
      const result = await setFamilyGoal(type, target, reward, title);
      wx.showToast({ title: '家庭目标已设定！', icon: 'success' });
      this.setData({ familyGoal: result.goal });
    } catch (err) {
      wx.showToast({ title: err.message || '设定失败', icon: 'none' });
    }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    this.setData({ activeChildId: childId });
    this.loadData(childId);
    // 重新加载超能力
    this.loadSuperpower(childId);
  },

  async loadSuperpower(childId) {
    try {
      const result = await getSuperpower(childId);
      this.setData({ superpower: result.superpower });
    } catch (e) { /* ignore */ }
  },

});
