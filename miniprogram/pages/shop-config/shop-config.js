const { listItems, saveItem, deleteItem } = require('../../services/shopService');

// 图标预设
const ICON_OPTIONS = ['🎁','📺','🎮','🍕','🌳','🎪','🍬','🎬','🕹','🎫','🧸','📚','🎨','⚽','🍦','🎵','🌟','💎','👑','🏆'];

// 按年龄段的商品模板
const AGE_TEMPLATES = {
  '3-5': [
    { name: '看动画片15分钟', description: '选一集喜欢的动画片', icon: '📺', price: 20, category: 'reward' },
    { name: '贴纸一张', description: '挑选一张可爱贴纸', icon: '🌟', price: 10, category: 'reward' },
    { name: '小零食一份', description: '饼干或糖果', icon: '🍬', price: 15, category: 'reward' },
    { name: '多玩5分钟玩具', description: '延长玩耍时间', icon: '🧸', price: 20, category: 'reward' },
    { name: '妈妈讲故事10分钟', description: '选一本喜欢的绘本', icon: '📚', price: 25, category: 'reward' },
    { name: '去小区游乐场', description: '滑滑梯、荡秋千', icon: '🎪', price: 40, category: 'reward' },
    { name: '选晚餐吃什么', description: '今天你说了算', icon: '🍕', price: 30, category: 'reward' },
    { name: '一起画画15分钟', description: '用水彩笔画画', icon: '🎨', price: 20, category: 'reward' },
    { name: '吹泡泡10分钟', description: '在阳台吹泡泡', icon: '🫧', price: 15, category: 'reward' },
    { name: '玩橡皮泥20分钟', description: '捏喜欢的造型', icon: '🧩', price: 20, category: 'reward' }
  ],
  '6-8': [
    { name: '看动画片20分钟', description: '选一部喜欢的动画', icon: '📺', price: 25, category: 'reward' },
    { name: '玩iPad游戏15分钟', description: '限时游戏时间', icon: '🎮', price: 30, category: 'reward' },
    { name: '小零食一份', description: '薯片或冰淇淋', icon: '🍦', price: 15, category: 'reward' },
    { name: '去公园玩', description: '周末去公园半天', icon: '🌳', price: 60, category: 'reward' },
    { name: '买一本新书', description: '挑选喜欢的课外书', icon: '📚', price: 50, category: 'reward' },
    { name: '看一部电影', description: '选一部合家欢电影', icon: '🎬', price: 40, category: 'reward' },
    { name: '邀请朋友来玩', description: '周末请好朋友来家里', icon: '🤝', price: 70, category: 'reward' },
    { name: '吃一顿肯德基', description: '周末去吃汉堡薯条', icon: '🍔', price: 55, category: 'reward' },
    { name: '买个新玩具', description: '挑选一个小玩具', icon: '🎁', price: 80, category: 'reward' },
    { name: '骑自行车30分钟', description: '在小区里骑行', icon: '🚲', price: 20, category: 'reward' }
  ],
  '9-11': [
    { name: '打游戏30分钟', description: '限时游戏时间', icon: '🎮', price: 35, category: 'reward' },
    { name: '去游乐园', description: '周末去游乐园玩一天', icon: '🎪', price: 120, category: 'reward' },
    { name: '买一个新游戏', description: '挑选一款游戏', icon: '🕹', price: 100, category: 'reward' },
    { name: '和同学出去玩', description: '放学后和朋友聚会', icon: '🤝', price: 60, category: 'reward' },
    { name: '买文具套装', description: '挑选喜欢的文具', icon: '✏️', price: 40, category: 'reward' },
    { name: '看一部电影', description: '去电影院看电影', icon: '🎬', price: 50, category: 'reward' },
    { name: '吃一次火锅', description: '周末和家人吃火锅', icon: '🍲', price: 70, category: 'reward' },
    { name: '买零食大礼包', description: '挑选喜欢的零食组合', icon: '🍬', price: 45, category: 'reward' },
    { name: '换新书包', description: '挑选一个新书包', icon: '🎒', price: 150, category: 'reward' },
    { name: '晚睡30分钟', description: '周末可以晚睡一会', icon: '🌙', price: 30, category: 'reward' }
  ],
  '12+': [
    { name: '打游戏1小时', description: '限时游戏时间', icon: '🎮', price: 40, category: 'reward' },
    { name: '和朋友去商场', description: '和同学逛街购物', icon: '🛍', price: 80, category: 'reward' },
    { name: '买一双新鞋', description: '挑选喜欢的运动鞋', icon: '👟', price: 200, category: 'reward' },
    { name: '去电影院', description: '看一部新上映的电影', icon: '🎬', price: 60, category: 'reward' },
    { name: '买个新耳机', description: '挑选一副耳机', icon: '🎧', price: 150, category: 'reward' },
    { name: '吃一次自助餐', description: '周末去吃自助大餐', icon: '🍽', price: 100, category: 'reward' },
    { name: '去密室逃脱', description: '和朋友组队去玩', icon: '🔐', price: 120, category: 'reward' },
    { name: '买件新衣服', description: '挑选喜欢的衣服', icon: '👔', price: 180, category: 'reward' },
    { name: '买新手机壳', description: '换个好看的保护壳', icon: '📱', price: 70, category: 'reward' },
    { name: '晚睡1小时', description: '周末可以晚睡', icon: '🌙', price: 35, category: 'reward' }
  ]
};

Page({
  data: {
    items: [],
    showModal: false,
    showRandomSheet: false,
    showDetail: false,
    detailItem: {},
    editingId: null,
    form: {
      name: '', description: '', price: 50, icon: '🎁',
      category: 'reward', stock: -1
    },
    iconOptions: ICON_OPTIONS,
    selectedAge: '',
    ageGroups: [
      { value: '3-5', label: '3-5岁' },
      { value: '6-8', label: '6-8岁' },
      { value: '9-11', label: '9-11岁' },
      { value: '12+', label: '12岁以上' }
    ]
  },

  async onShow() {
    await this.loadItems();
  },

  async loadItems() {
    try {
      const result = await listItems();
      this.setData({ items: result.items || [] });
    } catch (e) { /* ignore */ }
  },

  onAdd() {
    this.setData({
      showModal: true, editingId: null,
      form: { name: '', description: '', price: 50, icon: '🎁', category: 'reward', stock: -1 }
    });
  },

  // 点击商品 → 打开详情
  onTapItem(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    this.setData({ showDetail: true, detailItem: item });
  },

  onCloseDetail() {
    this.setData({ showDetail: false });
  },

  // 从详情中编辑
  onEditFromDetail() {
    const item = this.data.detailItem;
    if (!item._id) return;
    this.setData({
      showDetail: false,
      showModal: true,
      editingId: item._id,
      form: {
        name: item.name || '',
        description: item.description || '',
        price: item.price || 50,
        icon: item.icon || '🎁',
        category: item.category || 'reward',
        stock: item.stock !== undefined ? item.stock : -1
      }
    });
  },

  // 从详情中删除
  onDeleteFromDetail() {
    const item = this.data.detailItem;
    if (!item) return;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${item.name}」吗？删除后不可恢复。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteItem(item._id);
            wx.showToast({ title: '已删除', icon: 'success' });
            this.setData({ showDetail: false });
            this.loadItems();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onCloseModal() {
    this.setData({ showModal: false });
  },

  preventBubble() {},

  onFormField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSelectIcon(e) {
    this.setData({ 'form.icon': e.currentTarget.dataset.icon });
  },

  onSelectCategory(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.cat });
  },

  onStockToggle() {
    const stock = this.data.form.stock === -1 ? 10 : -1;
    this.setData({ 'form.stock': stock });
  },

  onPriceChange(e) {
    this.setData({ 'form.price': e.detail.value });
  },

  onPriceDecrease() {
    const price = Math.max(1, (this.data.form.price || 50) - 5);
    this.setData({ 'form.price': price });
  },

  onPriceIncrease() {
    const price = Math.min(500, (this.data.form.price || 50) + 5);
    this.setData({ 'form.price': price });
  },

  async onSave() {
    const form = this.data.form;
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    if (!form.price || form.price < 1) {
      wx.showToast({ title: '价格至少为1积分', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Math.floor(form.price),
      icon: form.icon,
      category: form.category,
      stock: form.stock
    };
    if (this.data.editingId) {
      data.id = this.data.editingId;
    }

    try {
      await saveItem(data);
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ showModal: false });
      this.loadItems();
    } catch (err) {
      wx.hideLoading();
      console.error('保存失败:', err);
      wx.showToast({ title: err.message || '保存失败', icon: 'none', duration: 3000 });
    }
  },

  // 使用推荐默认商品
  async onUseDefault() {
    const defaults = [
      { name: '看动画片15分钟', description: '选一集喜欢的动画片', icon: '📺', price: 20, category: 'reward' },
      { name: '小零食一份', description: '饼干或糖果', icon: '🍬', price: 15, category: 'reward' },
      { name: '贴纸一张', description: '挑选一张可爱贴纸', icon: '🌟', price: 10, category: 'reward' },
      { name: '去公园玩', description: '周末去公园玩半天', icon: '🌳', price: 60, category: 'reward' },
      { name: '买一本新书', description: '挑选喜欢的课外书', icon: '📚', price: 50, category: 'reward' },
      { name: '多看10分钟iPad', description: '限时延长屏幕时间', icon: '📱', price: 25, category: 'reward' },
      { name: '玩桌游30分钟', description: '选一款桌游和家人玩', icon: '🎲', price: 20, category: 'reward' },
      { name: '选周末去哪玩', description: '周末出行由你决定', icon: '🎪', price: 40, category: 'reward' }
    ];

    wx.showModal({
      title: '使用推荐商品',
      content: `将导入${defaults.length}个系统推荐的默认商品（覆盖现有列表）。确定继续？`,
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '生成中...' });
        let successCount = 0;
        for (const item of defaults) {
          try {
            await saveItem({
              name: item.name,
              description: item.description,
              price: item.price,
              icon: item.icon,
              category: item.category,
              stock: -1
            });
            successCount++;
          } catch (e) {
            console.error('生成商品失败:', item.name, e);
          }
        }
        wx.hideLoading();
        if (successCount > 0) {
          wx.showToast({ title: `已添加${successCount}个商品`, icon: 'success' });
          this.loadItems();
        } else {
          wx.showToast({ title: '添加失败，请检查数据库权限', icon: 'none', duration: 3000 });
        }
      }
    });
  },

  // 随机生成
  onShowRandom() {
    this.setData({ showRandomSheet: true });
  },

  onCloseRandom() {
    this.setData({ showRandomSheet: false });
  },

  onSelectAge(e) {
    this.setData({ selectedAge: e.currentTarget.dataset.age });
  },

  async onConfirmRandom() {
    const age = this.data.selectedAge;
    if (!age) {
      wx.showToast({ title: '请先选择年龄段', icon: 'none' });
      return;
    }

    const templates = AGE_TEMPLATES[age];
    if (!templates || templates.length === 0) {
      wx.showToast({ title: '该年龄段暂无模板', icon: 'none' });
      return;
    }

    // 随机抽取5个不重复的商品
    const shuffled = templates.slice().sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    wx.showLoading({ title: '正在生成...' });
    let successCount = 0;

    for (const item of selected) {
      try {
        await saveItem({
          name: item.name,
          description: item.description,
          price: item.price,
          icon: item.icon,
          category: item.category,
          stock: -1
        });
        successCount++;
      } catch (e) {
        console.error('生成商品失败:', item.name, e);
      }
    }
    wx.hideLoading();

    this.setData({ showRandomSheet: false, selectedAge: '' });
    if (successCount > 0) {
      wx.showToast({ title: `成功生成${successCount}个商品`, icon: 'success' });
      this.loadItems();
    } else {
      wx.showToast({ title: '生成失败，请检查数据库权限', icon: 'none', duration: 3000 });
    }
  },

});
