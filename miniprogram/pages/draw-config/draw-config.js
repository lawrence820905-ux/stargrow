const { getPools, savePool } = require('../../services/drawService');
const { calcProbabilities } = require('../../utils/draw');

// 随机奖品模板
const PRIZE_POOLS = {
  common: [
    { name: '5积分', type: 'points', pointsValue: 5, icon: '⭐' },
    { name: '10积分', type: 'points', pointsValue: 10, icon: '⭐' },
    { name: '15积分', type: 'points', pointsValue: 15, icon: '💫' },
    { name: '8积分', type: 'points', pointsValue: 8, icon: '✨' },
    { name: '12积分', type: 'points', pointsValue: 12, icon: '🌟' },
    { name: '6积分', type: 'points', pointsValue: 6, icon: '💡' },
    { name: '20积分', type: 'points', pointsValue: 20, icon: '🔑' },
    { name: '贴纸一张', type: 'reward', pointsValue: 0, rewardTitle: '贴纸一张', rewardDescription: '可爱的贴纸奖励', icon: '🌟' },
    { name: '额外5分钟游戏', type: 'reward', pointsValue: 0, rewardTitle: '额外游戏时间', rewardDescription: '多玩5分钟', icon: '🎮' },
    { name: '10积分', type: 'points', pointsValue: 10, icon: '💎' }
  ],
  rare: [
    { name: '30积分', type: 'points', pointsValue: 30, icon: '🌟' },
    { name: '25积分', type: 'points', pointsValue: 25, icon: '💎' },
    { name: '40积分', type: 'points', pointsValue: 40, icon: '🔥' },
    { name: '小零食一份', type: 'reward', pointsValue: 20, rewardTitle: '小零食一份', rewardDescription: '家长准备的小零食', icon: '🍬' },
    { name: '看动画片15分钟', type: 'reward', pointsValue: 10, rewardTitle: '动画片15分钟', rewardDescription: '可看一集动画片', icon: '📺' },
    { name: '35积分', type: 'points', pointsValue: 35, icon: '🎯' },
    { name: '选晚餐菜单', type: 'reward', pointsValue: 15, rewardTitle: '选晚餐菜单', rewardDescription: '今天由你决定吃什么', icon: '🍽' },
    { name: '50积分', type: 'points', pointsValue: 50, icon: '💫' }
  ],
  epic: [
    { name: '100积分', type: 'points', pointsValue: 100, icon: '💎' },
    { name: '80积分', type: 'points', pointsValue: 80, icon: '🔥' },
    { name: '看一部电影', type: 'reward', pointsValue: 30, rewardTitle: '家庭电影之夜', rewardDescription: '选一部喜欢的电影', icon: '🎬' },
    { name: '去公园玩', type: 'reward', pointsValue: 20, rewardTitle: '公园游玩', rewardDescription: '周末去公园玩半天', icon: '🌳' },
    { name: '120积分', type: 'points', pointsValue: 120, icon: '👑' },
    { name: '免做一项任务', type: 'reward', pointsValue: 0, rewardTitle: '免做一项任务', rewardDescription: '今天可以跳过一项任务', icon: '🎫' },
    { name: '买一个新玩具', type: 'reward', pointsValue: 40, rewardTitle: '新玩具', rewardDescription: '挑选一个小玩具', icon: '🎁' }
  ],
  legendary: [
    { name: '300积分', type: 'points', pointsValue: 300, icon: '👑' },
    { name: '500积分', type: 'points', pointsValue: 500, icon: '🏆' },
    { name: '去游乐园', type: 'reward', pointsValue: 100, rewardTitle: '游乐园一日游', rewardDescription: '周末去游乐园玩一天', icon: '🎪' },
    { name: '特别大餐', type: 'reward', pointsValue: 50, rewardTitle: '特别大餐', rewardDescription: '一次特别的家庭大餐', icon: '🍕' },
    { name: '买一个游戏', type: 'reward', pointsValue: 80, rewardTitle: '一个新游戏', rewardDescription: '挑选一款喜欢的游戏', icon: '🕹' },
    { name: '200积分', type: 'points', pointsValue: 200, icon: '💎' },
    { name: '400积分', type: 'points', pointsValue: 400, icon: '🔥' }
  ]
};

Page({
  data: {
    poolType: 'small',
    cost: 20,
    dailyLimit: 3,
    items: [],
    showAddItem: false,
    editingIndex: null,  // null = 新增, number = 编辑第几条
    newItem: {
      name: '', type: 'points', pointsValue: 0,
      rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '⭐'
    }
  },

  async onLoad(options) {
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
        this.setData({ cost: pool.cost, dailyLimit: pool.dailyLimit || 3, items });
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

  onDailyLimitDecrease() {
    if (this.data.dailyLimit > 1) {
      this.setData({ dailyLimit: this.data.dailyLimit - 1 });
    }
  },

  onDailyLimitIncrease() {
    if (this.data.dailyLimit < 10) {
      this.setData({ dailyLimit: this.data.dailyLimit + 1 });
    }
  },

  onDailyLimitChange(e) {
    this.setData({ dailyLimit: e.detail.value });
  },

  onAddItem() {
    this.setData({
      showAddItem: true,
      editingIndex: null,
      newItem: {
        name: '', type: 'points', pointsValue: 0,
        rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '⭐'
      }
    });
  },

  // 点击已有奖品 → 编辑
  onEditItem(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.items[index];
    if (!item) return;
    this.setData({
      showAddItem: true,
      editingIndex: index,
      newItem: {
        name: item.name || '',
        type: item.type || 'points',
        pointsValue: item.pointsValue || 0,
        rewardTitle: item.rewardTitle || '',
        rewardDescription: item.rewardDescription || '',
        rarity: item.rarity || 'common',
        icon: item.icon || '⭐'
      }
    });
  },

  onCloseAddItem() {
    this.setData({ showAddItem: false });
  },

  preventBubble() {},

  onModalPointsDecrease() {
    if (this.data.newItem.pointsValue > 0) {
      this.setData({ 'newItem.pointsValue': Math.max(0, this.data.newItem.pointsValue - 5) });
    }
  },

  onModalPointsIncrease() {
    if (this.data.newItem.pointsValue < 500) {
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

  onUseDefaultItems() {
    const defaults = [
      { id: 'def_1', name: '5积分', type: 'points', pointsValue: 5, rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '⭐' },
      { id: 'def_2', name: '10积分', type: 'points', pointsValue: 10, rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '⭐' },
      { id: 'def_3', name: '15积分', type: 'points', pointsValue: 15, rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '💫' },
      { id: 'def_4', name: '8积分', type: 'points', pointsValue: 8, rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '✨' },
      { id: 'def_5', name: '12积分', type: 'points', pointsValue: 12, rewardTitle: '', rewardDescription: '', rarity: 'common', icon: '🌟' },
      { id: 'def_6', name: '贴纸一张', type: 'reward', pointsValue: 0, rewardTitle: '贴纸一张', rewardDescription: '可爱的贴纸奖励', rarity: 'common', icon: '🌟' },
      { id: 'def_7', name: '25积分', type: 'points', pointsValue: 25, rewardTitle: '', rewardDescription: '', rarity: 'rare', icon: '💎' },
      { id: 'def_8', name: '30积分', type: 'points', pointsValue: 30, rewardTitle: '', rewardDescription: '', rarity: 'rare', icon: '🌟' },
      { id: 'def_9', name: '80积分', type: 'points', pointsValue: 80, rewardTitle: '', rewardDescription: '', rarity: 'epic', icon: '🔥' },
      { id: 'def_10', name: '300积分', type: 'points', pointsValue: 300, rewardTitle: '', rewardDescription: '', rarity: 'legendary', icon: '👑' }
    ];

    wx.showModal({
      title: '使用推荐配置',
      content: '将使用系统推荐的默认奖品配置（6普通+2稀有+1史诗+1传说），覆盖当前奖品列表。确定继续？',
      success: (res) => {
        if (!res.confirm) return;
        const probs = calcProbabilities(defaults);
        this.setData({ items: probs });
        wx.showToast({ title: '已应用推荐配置', icon: 'success' });
      }
    });
  },

  onRandomItems() {
    const pool = PRIZE_POOLS;
    const pick = (arr, n) => {
      const shuffled = arr.slice().sort(() => Math.random() - 0.5);
      return shuffled.slice(0, n);
    };

    // 按概率分配: 60% 普通(6) + 25% 稀有(2) + 10% 史诗(1) + 5% 传说(1) = 10
    const generated = [
      ...pick(pool.common, 6).map(p => ({ ...p, rarity: 'common' })),
      ...pick(pool.rare, 2).map(p => ({ ...p, rarity: 'rare' })),
      ...pick(pool.epic, 1).map(p => ({ ...p, rarity: 'epic' })),
      ...pick(pool.legendary, 1).map(p => ({ ...p, rarity: 'legendary' }))
    ];

    const items = [
      ...this.data.items,
      ...generated.map(p => ({
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: p.name,
        type: p.type,
        pointsValue: p.pointsValue,
        rewardTitle: p.rewardTitle || '',
        rewardDescription: p.rewardDescription || '',
        rarity: p.rarity,
        icon: p.icon
      }))
    ];

    const probs = calcProbabilities(items);
    this.setData({ items: probs });
    wx.showToast({ title: '已添加10个随机奖品', icon: 'success' });
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
      rarity: ni.rarity,
      icon: ni.icon
    };

    let items;
    const editingIndex = this.data.editingIndex;
    if (editingIndex !== null) {
      // 编辑模式：保留原 id，替换对应位置
      item.id = this.data.items[editingIndex].id;
      items = [...this.data.items];
      items[editingIndex] = item;
    } else {
      // 新增模式
      items = [...this.data.items, item];
    }

    const probs = calcProbabilities(items);
    this.setData({ items: probs, showAddItem: false, editingIndex: null });
  },

  onDeleteItem(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items.filter((_, i) => i !== index);
    const probs = calcProbabilities(items);
    this.setData({ items: probs });
  },

  async onSave() {
    try {
      const itemsForSave = this.data.items.map(i => ({
        id: i.id, name: i.name, type: i.type,
        pointsValue: Math.max(0, i.pointsValue || 0), rewardTitle: i.rewardTitle || '',
        rewardDescription: i.rewardDescription || '',
        rarity: i.rarity, icon: i.icon
      }));
      await savePool(this.data.poolType, this.data.poolType === 'small' ? '小宝箱' : '大宝箱', this.data.cost, itemsForSave, this.data.dailyLimit);
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败，请稍后重试', icon: 'none' });
    }
  }
});
