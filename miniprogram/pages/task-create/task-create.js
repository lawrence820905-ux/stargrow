const { getChildren } = require('../../utils/auth');
const { createTask, updateTask, getTask } = require('../../services/taskService');
const app = getApp();

const categories = [
  { key: 'sport', name: '运动', icon: '⚽' },
  { key: 'life', name: '生活', icon: '🏠' },
  { key: 'study', name: '学习', icon: '📚' }
];

Page({
  data: {
    isEdit: false,
    taskId: '',
    title: '',
    description: '',
    category: 'sport',
    basePoints: 10,
    selectedChildId: '',
    children: [],
    categories,
    taskType: 'daily',
    navBarTop: 88
  },

  async onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ navBarTop: (sysInfo.statusBarHeight || 20) + 88 });

    this.setData({ children: app.globalData.children });

    if (options.childId) {
      this.setData({ selectedChildId: options.childId });
    } else {
      const activeChild = app.getActiveChild();
      if (activeChild) this.setData({ selectedChildId: activeChild._id });
    }

    if (options.taskId) {
      this.setData({ isEdit: true, taskId: options.taskId });
      await this.loadTask(options.taskId);
    }
  },

  async loadTask(taskId) {
    try {
      const result = await getTask(taskId);
      const t = result.task;
      this.setData({
        title: t.title,
        description: t.description || '',
        category: t.category,
        basePoints: t.basePoints,
        taskType: t.taskType || 'daily',
        selectedChildId: t.childId
      });
    } catch (e) {
      wx.showToast({ title: '加载任务失败', icon: 'none' });
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },

  onCategorySelect(e) {
    this.setData({ category: e.currentTarget.dataset.key });
  },

  onPointsDecrease() {
    if (this.data.basePoints > 1) {
      this.setData({ basePoints: this.data.basePoints - 1 });
    }
  },

  onPointsIncrease() {
    if (this.data.basePoints < 50) {
      this.setData({ basePoints: this.data.basePoints + 1 });
    }
  },

  onPointsChange(e) {
    this.setData({ basePoints: e.detail.value });
  },

  onChildSelect(e) {
    this.setData({ selectedChildId: e.currentTarget.dataset.id });
  },

  onTaskTypeChange(e) {
    this.setData({ taskType: e.currentTarget.dataset.type });
  },

  async onSubmit() {
    const { isEdit, taskId, title, description, category, basePoints, selectedChildId, taskType } = this.data;

    if (!title.trim()) {
      wx.showToast({ title: '请输入任务标题', icon: 'none' });
      return;
    }
    if (!selectedChildId) {
      wx.showToast({ title: '请选择孩子', icon: 'none' });
      return;
    }

    try {
      if (isEdit) {
        await updateTask(taskId, { title, description, category, basePoints, taskType });
      } else {
        await createTask(selectedChildId, title, description, category, basePoints, taskType);
      }
      wx.showToast({ title: isEdit ? '已更新' : '已创建', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  }
});
