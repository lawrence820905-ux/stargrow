const { getExchangeRecords, fulfillExchange } = require('../../services/shopService');
const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    children: [],
    activeChildId: '',
    records: []
  },

  async onLoad() {
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id });
      await this.loadData(activeChild._id);
    }
  },

  async loadData(childId) {
    try {
      const result = await getExchangeRecords(childId);
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
  },

  async onFulfill(e) {
    const { id, fulfilled } = e.currentTarget.dataset;
    if (fulfilled) return;

    try {
      await fulfillExchange(id);
      const records = this.data.records.map(r => {
        if (r._id === id) return { ...r, isFulfilled: true };
        return r;
      });
      this.setData({ records });
      wx.showToast({ title: '已兑现', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  }
});
