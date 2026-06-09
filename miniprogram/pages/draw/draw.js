const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const { getPools, doDraw, getRecords, fulfillReward } = require('../../services/drawService');
const { refreshChildren } = require('../../services/childService');
const app = getApp();

Page({
  data: {
    loading: true,
    children: [],
    activeChildId: '',
    activeChild: {},
    poolType: 'small',
    activePool: null,
    drawing: false,
    showResult: false,
    lastRecord: {},
    recentRecords: []
  },

  async onShow() {
    await refreshChildren();
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) this.setData({ activeChildId: activeChild._id, activeChild });
    await this.loadPools();
    if (activeChild) await this.loadRecords(activeChild._id);
  },

  async loadPools() {
    try {
      const result = await getPools();
      const pool = this.data.poolType === 'small' ? result.smallPool : result.bigPool;
      this.setData({
        activePool: pool,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async loadRecords(childId) {
    try {
      const result = await getRecords(childId, 1, 20);
      this.setData({
        recentRecords: (result.records || []).map(r => ({
          ...r,
          timeText: relativeTime(r.createdAt)
        }))
      });
    } catch (e) { /* ignore */ }
  },

  onSwitchType(e) {
    const poolType = e.currentTarget.dataset.type;
    this.setData({ poolType });
    this.loadPools();
  },

  async onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    const activeChild = app.getActiveChild();
    this.setData({ activeChildId: childId, activeChild: activeChild || {} });
    this.loadRecords(childId);
  },

  async onDraw(e) {
    const childId = this.data.activeChildId;
    if (!childId) return;

    this.setData({ drawing: true });

    try {
      const result = await doDraw(childId, this.data.poolType);
      this.showDrawResult(result.record);

      await refreshChildren();
      const activeChild = app.getActiveChild();
      if (activeChild) this.setData({ activeChild, drawing: false });

      const confetti = this.selectComponent('#confetti');
      if (confetti) confetti.show();

      this.loadRecords(childId);
      this.loadPools();
    } catch (err) {
      this.setData({ drawing: false });
      wx.showToast({ title: err.message || '抽奖失败，请稍后重试', icon: 'none' });
    }
  },

  showDrawResult(record) {
    this.setData({ showResult: true, lastRecord: record || {} });
  },

  onCloseResult() {
    this.setData({ showResult: false });
  },

  async onFulfill(e) {
    const { id, fulfilled } = e.currentTarget.dataset;
    if (fulfilled) return;

    try {
      await fulfillReward(id);
      const records = this.data.recentRecords.map(r => {
        if (r._id === id) return { ...r, isFulfilled: true };
        return r;
      });
      this.setData({ recentRecords: records });
      wx.showToast({ title: '已兑奖', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
    }
  },

  onGoConfig() {
    wx.navigateTo({ url: '/pages/draw-config/draw-config' });
  },

  onGoShop() {
    wx.navigateTo({ url: '/pages/shop/shop' });
  }
});
