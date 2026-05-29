const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const { getPools, doDraw, batchDraw, getRecords } = require('../../services/drawService');
const { refreshChildren } = require('../../services/childService');
const app = getApp();

Page({
  data: {
    loading: true,
    children: [],
    activeChildId: '',
    activeChild: {},
    smallPool: null,
    bigPool: null,
    noPools: true,
    drawingSmall: false,
    drawingBig: false,
    showResult: false,
    lastRecord: {},
    recentRecords: []
  },

  async onShow() {
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) this.setData({ activeChildId: activeChild._id, activeChild });
    await this.loadPools();
    if (activeChild) await this.loadRecords(activeChild._id);
  },

  async loadPools() {
    try {
      const result = await getPools();
      this.setData({
        smallPool: result.smallPool,
        bigPool: result.bigPool,
        noPools: !result.smallPool && !result.bigPool,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async loadRecords(childId) {
    try {
      const result = await getRecords(childId, 1, 10);
      this.setData({
        recentRecords: (result.records || []).map(r => ({
          ...r,
          timeText: relativeTime(r.createdAt)
        }))
      });
    } catch (e) { /* ignore */ }
  },

  async onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    const activeChild = app.getActiveChild();
    this.setData({ activeChildId: childId, activeChild: activeChild || {} });
    this.loadRecords(childId);
  },

  async onSmallDraw(e) {
    await this.executeDraw('small', e.detail.count);
  },

  async onBigDraw(e) {
    await this.executeDraw('big', e.detail.count);
  },

  async executeDraw(poolType, count) {
    const childId = this.data.activeChildId;
    if (!childId) return;

    this.setData({ [`drawing${poolType === 'small' ? 'Small' : 'Big'}`]: true });

    try {
      let result;
      if (count === 1) {
        result = await doDraw(childId, poolType);
        this.showDrawResult(result.record);
      } else {
        result = await batchDraw(childId, poolType, count);
        if (result.records && result.records.length > 0) {
          this.showDrawResult(result.records[result.records.length - 1]);
        }
      }

      // Refresh
      await refreshChildren();
      const activeChild = app.getActiveChild();
      if (activeChild) this.setData({ activeChild, [`drawing${poolType === 'small' ? 'Small' : 'Big'}`]: false });

      const confetti = this.selectComponent('#confetti');
      if (confetti) confetti.show();

      this.loadRecords(childId);
      this.loadPools();
    } catch (err) {
      this.setData({ [`drawing${poolType === 'small' ? 'Small' : 'Big'}`]: false });
      wx.showToast({ title: err.message || '抽奖失败', icon: 'none' });
    }
  },

  showDrawResult(record) {
    this.setData({ showResult: true, lastRecord: record || {} });
  },

  onCloseResult() {
    this.setData({ showResult: false });
  },

  onGoConfig() {
    wx.navigateTo({ url: '/pages/draw-config/draw-config' });
  }
});
