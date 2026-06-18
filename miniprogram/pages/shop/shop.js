const { listItems, exchange, getExchangeRecords, fulfillExchange, addToWishlist, removeFromWishlist, getWishlist } = require('../../services/shopService');
const { getPools } = require('../../services/drawService');
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
    activeTab: 'shop',  // 'shop' | 'records'
    cheapestDrawCost: 20,
    displayItems: []
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
      let items = itemsResult.items || [];

      // 加载心愿单并标记
      if (childId) {
        try {
          const wishlistResult = await getWishlist(childId);
          const wishIds = new Set((wishlistResult.wishlist || []).map(w => w._id));
          items = items.map(item => ({
            ...item,
            isInWishlist: wishIds.has(item._id)
          }));
        } catch (e) { /* ignore */ }
      }

      console.log('[商城] 加载到商品数:', items.length);
      this.setData({ items });
      this.computeDisplayItems();
    } catch (e) {
      console.error('[商城] 商品加载失败:', e.message);
    }

    // 获取最低抽奖消耗积分
    try {
      const poolsResult = await getPools();
      let cheapestDrawCost = 20;
      if (poolsResult.smallPool) cheapestDrawCost = poolsResult.smallPool.cost || 20;
      if (poolsResult.bigPool && poolsResult.bigPool.cost < cheapestDrawCost) {
        cheapestDrawCost = poolsResult.bigPool.cost;
      }
      this.setData({ cheapestDrawCost });
    } catch (e) { /* 使用默认值 */ }

    if (childId) {
      try {
        const recordsResult = await getExchangeRecords(childId, 1, 5);
        const now = new Date();
        this.setData({
          records: (recordsResult.records || []).map(r => {
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
    this.computeDisplayItems();
  },

  onGoDraw() {
    wx.navigateTo({ url: '/pages/draw/draw' });
  },

  // 根据分类计算展示的商品列表
  computeDisplayItems() {
    const { items, activeCategory } = this.data;
    if (activeCategory === 'draw') {
      // 抽奖分类下不展示积分商品
      this.setData({ displayItems: [] });
    } else {
      // 全部和商品分类下展示积分兑换商品
      this.setData({
        displayItems: items.filter(i => !i.category || i.category === 'reward')
      });
    }
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

  // 切换心愿单
  async onToggleWishlist(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    const childId = this.data.activeChildId;
    if (!childId) {
      wx.showToast({ title: '请先选择孩子', icon: 'none' });
      return;
    }

    try {
      if (item.isInWishlist) {
        await removeFromWishlist(childId, item._id);
        wx.showToast({ title: '已移出心愿单', icon: 'none' });
      } else {
        await addToWishlist(childId, item._id);
        wx.showToast({ title: '已加入心愿单 💝', icon: 'success' });
      }
      // 更新本地状态
      const items = this.data.items.map(i => {
        if (i._id === item._id) return { ...i, isInWishlist: !i.isInWishlist };
        return i;
      });
      this.setData({ items });
      this.computeDisplayItems();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
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
