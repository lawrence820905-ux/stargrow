const { listItems, exchange, getExchangeRecords, fulfillExchange } = require('../../services/shopService');
const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const { refreshChildren } = require('../../services/childService');
const app = getApp();

Page({
  data: {
    children: [],
    activeChildId: '',
    activeChild: {},
    items: [],
    activeCategory: 'all',
    showConfirm: false,
    confirmItem: null,
    exchanging: false,
    showRecords: false,
    records: [],
    activeTab: 'shop'  // 'shop' | 'records'
  },

  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    await refreshChildren();
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id, activeChild });
    }
    // 始终加载商品列表（不依赖孩子选择）
    await this.loadData(activeChild ? activeChild._id : null);
  },

  async loadData(childId) {
    // 商品和兑换记录独立加载，一个失败不影响另一个
    try {
      const itemsResult = await listItems();
      const items = itemsResult.items || [];
      console.log('[商城] 加载到商品数:', items.length);
      this.setData({ items });
    } catch (e) {
      console.error('[商城] 商品加载失败:', e.message);
    }

    if (childId) {
      try {
        const recordsResult = await getExchangeRecords(childId, 1, 5);
        this.setData({
          records: (recordsResult.records || []).map(r => ({
            ...r,
            timeText: relativeTime(r.createdAt)
          }))
        });
      } catch (e) {
        console.error('[商城] 兑换记录加载失败:', e.message);
      }
    }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    const activeChild = app.getActiveChild();
    this.setData({ activeChildId: childId, activeChild: activeChild || {} });
    this.loadData(childId);
  },

  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  onTapCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat });
  },

  onGoDraw() {
    wx.switchTab({ url: '/pages/draw/draw' });
  },

  filteredItems() {
    const { items, activeCategory } = this.data;
    if (activeCategory === 'all') return items;
    return items.filter(i => i.category === activeCategory);
  },

  onTapItem(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    const child = this.data.activeChild;
    if ((child.currentPoints || 0) < item.price) {
      wx.showToast({ title: `还差${item.price - (child.currentPoints || 0)}分`, icon: 'none' });
      return;
    }
    this.setData({ showConfirm: true, confirmItem: item });
  },

  onCloseConfirm() {
    this.setData({ showConfirm: false, confirmItem: null });
  },

  async onConfirmExchange() {
    const item = this.data.confirmItem;
    const childId = this.data.activeChildId;
    if (!item || !childId) return;

    this.setData({ exchanging: true });

    try {
      const result = await exchange(childId, item._id);
      this.setData({ showConfirm: false, confirmItem: null, exchanging: false });

      // 刷新数据
      await refreshChildren();
      const activeChild = app.getActiveChild();
      if (activeChild) this.setData({ activeChild });

      // 撒花
      const confetti = this.selectComponent('#confetti');
      if (confetti) confetti.show();

      // 首次兑换提示
      if (result.isFirstExchange) {
        wx.showToast({ title: '🎉 首次兑换成功！', icon: 'none', duration: 2000 });
      } else {
        wx.showToast({ title: `兑换成功！-${item.price}分`, icon: 'success' });
      }

      this.loadData(childId);
    } catch (err) {
      this.setData({ exchanging: false });
      wx.showToast({ title: err.message || '兑换失败', icon: 'none' });
    }
  },

  onLoadMoreRecords() {
    // 切换到记录tab时已加载
  },

  async onFulfill(e) {
    const { id } = e.currentTarget.dataset;
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
