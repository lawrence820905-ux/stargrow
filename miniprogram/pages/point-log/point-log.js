const { getPointHistory } = require('../../services/statsService');
const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    navBarTop: 88,
    children: [],
    activeChildId: '',
    records: []
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
  },

  async loadData(childId) {
    try {
      const result = await getPointHistory(childId);
      this.setData({
        records: (result.records || []).map(r => ({
          ...r,
          timeText: relativeTime(r.createdAt)
        }))
      });
    } catch (e) { /* ignore */ }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    this.setData({ activeChildId: childId });
    this.loadData(childId);
  }
});
