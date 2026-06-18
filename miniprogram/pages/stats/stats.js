const { getChildOverview, getCategoryBreakdown, getWeeklyChart, getWeeklyComparison, getFamilyGarden, getSuperpower, cheerSibling } = require('../../services/statsService');
const { getChildren, getActiveChild } = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    children: [],
    activeChildId: '',
    overview: {},
    breakdown: {},
    familyGarden: [],
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
    await this.loadGardenAndSuperpower();
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

  async loadGardenAndSuperpower() {
    try {
      const [gardenRes, superpowerRes] = await Promise.all([
        getFamilyGarden(),
        this.data.activeChildId ? getSuperpower(this.data.activeChildId) : Promise.resolve(null)
      ]);
      this.setData({
        familyGarden: gardenRes.garden || [],
        superpower: superpowerRes ? superpowerRes.superpower : null
      });
    } catch (e) { /* ignore */ }
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

  // 为孩子加油
  async onCheerSibling(e) {
    const { toChildId } = e.currentTarget.dataset;
    const fromChildId = this.data.activeChildId;
    if (!fromChildId || !toChildId) return;
    try {
      const result = await cheerSibling(fromChildId, toChildId);
      wx.showToast({ title: result.message || '加油成功！', icon: 'success' });
      // 刷新花园数据
      this.loadGardenAndSuperpower();
    } catch (err) {
      wx.showToast({ title: err.message || '加油失败', icon: 'none' });
    }
  }
});
