const { getPools, savePool } = require('../../services/drawService');
const { calcProbabilities } = require('../../utils/draw');

Page({
  data: {
    navBarTop: 88,
    poolType: 'small',
    cost: 20,
    items: [],
    totalWeight: 0,
    showAddItem: false,
    newItem: {
      name: '', type: 'points', pointsValue: 0,
      rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '⭐'
    }
  },

  async onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ navBarTop: (sysInfo.statusBarHeight || 20) + 88 });

    if (options.type) {
      this.setData({ poolType: options.type });
    }
    await this.loadPool();
  },

  async loadPool() {
    try {
      const result = await getPools();
      const pool = this.data.poolType === 'small' ? result.smallPool : result.bigPool;
      if (pool) {
        const items = calcProbabilities(pool.items || []);
        const totalWeight = (pool.items || []).reduce((s, i) => s + (i.weight || 0), 0);
        this.setData({ cost: pool.cost, items, totalWeight });
      }
    } catch (e) { /* ignore */ }
  },

  onSwitchType(e) {
    this.setData({ poolType: e.currentTarget.dataset.type });
    this.loadPool();
  },

  onCostDecrease() {
    if (this.data.cost > 5) {
      this.setData({ cost: this.data.cost - 5 });
    }
  },

  onCostIncrease() {
    if (this.data.cost < 500) {
      this.setData({ cost: this.data.cost + 5 });
    }
  },

  onCostChange(e) {
    this.setData({ cost: e.detail.value });
  },

  onAddItem() {
    this.setData({
      showAddItem: true,
      newItem: {
        name: '', type: 'points', pointsValue: 0,
        rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '⭐'
      }
    });
  },

  onCloseAddItem() {
    this.setData({ showAddItem: false });
  },

  preventBubble() {},

  onModalPointsDecrease() {
    if (this.data.newItem.pointsValue > -100) {
      this.setData({ 'newItem.pointsValue': this.data.newItem.pointsValue - 5 });
    }
  },

  onModalPointsIncrease() {
    if (this.data.newItem.pointsValue < 100) {
      this.setData({ 'newItem.pointsValue': this.data.newItem.pointsValue + 5 });
    }
  },

  onNewItemField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`newItem.${field}`]: e.detail.value });
  },

  onNewItemFieldS(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`newItem.${field}`]: e.detail.value });
  },

  onNewItemType(e) {
    this.setData({ 'newItem.type': e.currentTarget.dataset.type });
  },

  onNewItemRarity(e) {
    this.setData({ 'newItem.rarity': e.currentTarget.dataset.rarity });
  },

  onConfirmAddItem() {
    const ni = this.data.newItem;
    if (!ni.name.trim()) {
      wx.showToast({ title: '请输入奖品名称', icon: 'none' });
      return;
    }
    const item = {
      id: 'item_' + Date.now(),
      name: ni.name,
      type: ni.type,
      pointsValue: ni.pointsValue,
      rewardTitle: ni.rewardTitle,
      rewardDescription: ni.rewardDescription,
      weight: { common: 60, rare: 25, epic: 10, legendary: 5 }[ni.rarity] || 10,
      rarity: ni.rarity,
      icon: ni.icon
    };
    const items = [...this.data.items, item];
    const probs = calcProbabilities(items);
    const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
    this.setData({ items: probs, totalWeight, showAddItem: false });
  },

  onDeleteItem(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items.filter((_, i) => i !== index);
    const probs = calcProbabilities(items);
    const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
    this.setData({ items: probs, totalWeight });
  },

  async onSave() {
    try {
      const itemsForSave = this.data.items.map(i => ({
        id: i.id, name: i.name, type: i.type,
        pointsValue: i.pointsValue, rewardTitle: i.rewardTitle || '',
        rewardDescription: i.rewardDescription || '',
        weight: i.weight, rarity: i.rarity, icon: i.icon
      }));
      await savePool(this.data.poolType, this.data.poolType === 'small' ? '小抽奖' : '大抽奖', this.data.cost, itemsForSave);
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  }
});
