const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const { getPools, doDraw, getRecords, fulfillReward, getTodayDrawCount } = require('../../services/drawService');
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
    showWishPrompt: false,
    lastRecord: {},
    recentRecords: [],
    todayDrawCount: 0,
    dailyLimit: 3
  },

  async onShow() {
    await refreshChildren();
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) this.setData({ activeChildId: activeChild._id, activeChild });
    await this.loadPools();
    if (activeChild) {
      await this.loadRecords(activeChild._id);
      await this.loadTodayDrawCount(activeChild._id);
    }
  },

  async loadPools() {
    try {
      const childId = this.data.activeChildId;
      const result = await getPools(childId);
      const pool = this.data.poolType === 'small' ? result.smallPool : result.bigPool;
      this.setData({
        activePool: pool,
        todayDrawCount: result.todayDrawCount || 0,
        dailyLimit: pool ? (pool.dailyLimit || 3) : 3,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async loadTodayDrawCount(childId) {
    try {
      const result = await getTodayDrawCount(childId);
      this.setData({
        todayDrawCount: result.todayDrawCount || 0,
        dailyLimit: result.dailyLimit || 3
      });
    } catch (e) { /* ignore */ }
  },

  async loadRecords(childId) {
    try {
      const result = await getRecords(childId, 1, 20);
      // 计算每个记录的剩余兑现天数
      const now = new Date();
      this.setData({
        recentRecords: (result.records || []).map(r => {
          let daysLeft = -1;
          if (!r.isFulfilled && r.expectedFulfillBy) {
            const fulfillDate = new Date(r.expectedFulfillBy);
            daysLeft = Math.ceil((fulfillDate - now) / (1000 * 60 * 60 * 24));
          }
          return {
            ...r,
            timeText: relativeTime(r.createdAt),
            daysLeft
          };
        })
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
    this.loadTodayDrawCount(childId);
  },

  // 点击抽奖按钮 → 先弹出对话提示
  onDrawTap() {
    this.setData({ showWishPrompt: true });
  },

  // 关闭对话提示
  onCloseWishPrompt() {
    this.setData({ showWishPrompt: false });
  },

  // 确认抽奖
  async onDraw(e) {
    this.setData({ showWishPrompt: false });

    const childId = this.data.activeChildId;
    if (!childId) return;

    this.setData({ drawing: true });

    try {
      const result = await doDraw(childId, this.data.poolType);
      this.showDrawResult(result.record);

      // 更新今日抽奖次数
      this.setData({
        todayDrawCount: result.todayDrawCount || (this.data.todayDrawCount + 1),
        dailyLimit: result.dailyLimit || this.data.dailyLimit
      });

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
