const { listCustomAchievements, saveCustomAchievement, deleteCustomAchievement } = require('../../services/achievementService');
const { achievements: builtInAchievements } = require('../../config/constants');

Page({
  data: {
    navBarTop: 88,
    builtInAchievements,
    customAchievements: [],
    allAchievements: [],
    showModal: false,
    editingKey: '',
    form: {
      name: '',
      description: '',
      icon: '⭐',
      category: 'all',
      count: 10
    }
  },

  async onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ navBarTop: (sysInfo.statusBarHeight || 20) + 88 });
    await this.loadData();
  },

  async loadData() {
    try {
      const result = await listCustomAchievements();
      this.setData({ customAchievements: result.achievements || [] });
    } catch (e) { /* ignore */ }
    this.buildList();
  },

  buildList() {
    const customs = this.data.customAchievements;
    const builtIns = this.data.builtInAchievements;
    const overrideMap = {};
    const customOnly = [];

    customs.forEach(c => {
      if (c.overridesKey) {
        overrideMap[c.overridesKey] = c;
      } else {
        customOnly.push(c);
      }
    });

    // Built-in achievements, merged with overrides
    const merged = builtIns.map(b => {
      const override = overrideMap[b.key];
      if (override) {
        return {
          key: b.key,
          name: override.name,
          description: override.description,
          icon: override.icon,
          category: override.category || 'all',
          count: override.count,
          enabled: override.enabled !== false,
          isOverridden: true,
          _id: override._id,
          isCustom: false
        };
      }
      return {
        key: b.key,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category || 'all',
        count: b.count,
        enabled: true,
        isOverridden: false,
        isCustom: false
      };
    });

    // Custom achievements (without overridesKey)
    const customMapped = customOnly.map(c => ({
      key: 'custom_' + c._id,
      _id: c._id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      category: c.category || 'all',
      count: c.count,
      enabled: c.enabled !== false,
      isCustom: true,
      isOverridden: false
    }));

    this.setData({ allAchievements: [...merged, ...customMapped] });
  },

  onShowAdd() {
    this.setData({
      showModal: true,
      editingKey: '',
      form: { name: '', description: '', icon: '⭐', category: 'all', count: 10 }
    });
  },

  onEditItem(e) {
    const key = e.currentTarget.dataset.key;
    const item = this.data.allAchievements.find(a => a.key === key);
    if (!item) return;

    this.setData({
      showModal: true,
      editingKey: key,
      form: {
        name: item.name,
        description: item.description,
        icon: item.icon,
        category: item.category || 'all',
        count: item.count || 10
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

  onFormSlider(e) {
    this.setData({ 'form.count': Number(e.detail.value) || 10 });
  },

  onCategorySelect(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.category });
  },

  onCountDecrease() {
    const count = Number(this.data.form.count) || 10;
    if (count > 1) {
      this.setData({ 'form.count': count - 1 });
    }
  },

  onCountIncrease() {
    const count = Number(this.data.form.count) || 10;
    if (count < 200) {
      this.setData({ 'form.count': count + 1 });
    }
  },

  async onConfirmSave() {
    const { name, description, icon, category, count } = this.data.form;
    if (!name.trim()) {
      wx.showToast({ title: '请输入成就名称', icon: 'none' });
      return;
    }

    const saveData = {
      name: name.trim(),
      description: description.trim() || name.trim(),
      icon: icon || '⭐',
      category,
      count: Number(count) || 10
    };

    // If editing a built-in achievement, save as override
    const editingKey = this.data.editingKey;
    const isBuiltIn = this.data.builtInAchievements.some(b => b.key === editingKey);

    if (isBuiltIn) {
      // Find existing override
      const existing = this.data.customAchievements.find(c => c.overridesKey === editingKey);
      saveData.overridesKey = editingKey;
      if (existing) saveData.id = existing._id;
    } else if (editingKey && editingKey.startsWith('custom_')) {
      saveData.id = this.data.allAchievements.find(a => a.key === editingKey)?._id;
    }

    try {
      await saveCustomAchievement(saveData);
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ showModal: false });
      await this.loadData();
    } catch (err) {
      wx.showModal({
        title: '保存失败',
        content: err.message || '未知错误',
        showCancel: false
      });
    }
  },

  async onToggleItem(e) {
    const key = e.currentTarget.dataset.key;
    const item = this.data.allAchievements.find(a => a.key === key);
    if (!item) return;

    const newEnabled = !item.enabled;
    const isBuiltIn = this.data.builtInAchievements.some(b => b.key === key);

    if (isBuiltIn) {
      const existing = this.data.customAchievements.find(c => c.overridesKey === key);
      const saveData = {
        name: item.name,
        description: item.description,
        icon: item.icon,
        category: item.category,
        count: item.count,
        enabled: newEnabled,
        overridesKey: key
      };
      if (existing) saveData.id = existing._id;
      try {
        await saveCustomAchievement(saveData);
        await this.loadData();
      } catch (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      }
    } else if (item.isCustom) {
      try {
        await saveCustomAchievement({
          id: item._id,
          name: item.name,
          description: item.description,
          icon: item.icon,
          category: item.category,
          count: item.count,
          enabled: newEnabled
        });
        await this.loadData();
      } catch (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      }
    }
  },

  async onResetBuiltIn(e) {
    const key = e.currentTarget.dataset.key;
    const res = await new Promise(resolve => {
      wx.showModal({ title: '恢复默认', content: '将恢复为系统默认设置', success: resolve });
    });
    if (!res.confirm) return;

    const existing = this.data.customAchievements.find(c => c.overridesKey === key);
    if (existing) {
      try {
        await deleteCustomAchievement(existing._id);
        wx.showToast({ title: '已恢复', icon: 'success' });
        await this.loadData();
      } catch (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' });
      }
    }
  },

  async onDeleteCustom(e) {
    const id = e.currentTarget.dataset.id;
    const res = await new Promise(resolve => {
      wx.showModal({ title: '确认删除', content: '删除后不可恢复', success: resolve });
    });
    if (!res.confirm) return;

    try {
      await deleteCustomAchievement(id);
      wx.showToast({ title: '已删除', icon: 'success' });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || '删除失败', icon: 'none' });
    }
  }
});
