const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const { listTasks, deleteTask } = require('../../services/taskService');
const app = getApp();

const categories = [
  { key: 'all', name: '全部' },
  { key: 'sport', name: '运动' },
  { key: 'life', name: '生活' },
  { key: 'study', name: '学习' }
];

Page({
  data: {
    loading: true,
    children: [],
    activeChildId: '',
    categories,
    activeCategory: 'all',
    tasks: [],
    page: 1,
    hasMore: false,
    activeTaskType: 'all',
    taskTypes: [
      { key: 'all', name: '全部' },
      { key: 'daily', name: '日常' },
      { key: 'special', name: '特殊' }
    ],
    showDetail: false,
    detailTask: {}
  },

  async onShow() {
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id });
    }
    await this.loadTasks();
  },

  async loadTasks(append = false) {
    if (!append) this.setData({ loading: true, page: 1 });

    const childId = this.data.activeChildId;
    if (!childId) { this.setData({ loading: false }); return; }

    try {
      const category = this.data.activeCategory === 'all' ? undefined : this.data.activeCategory;
      const result = await listTasks(childId, category, undefined, this.data.activeTaskType, this.data.page);

      const tasks = (result.tasks || []).map(t => ({
        ...t,
        createdAtText: relativeTime(t.createdAt)
      }));

      this.setData({
        tasks: append ? [...this.data.tasks, ...tasks] : tasks,
        hasMore: tasks.length >= 20,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    this.setData({ activeChildId: childId });
    this.loadTasks();
  },

  onCategoryChange(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.key });
    this.loadTasks();
  },

  onTaskTypeChange(e) {
    this.setData({ activeTaskType: e.currentTarget.dataset.key });
    this.loadTasks();
  },

  loadMore() {
    this.setData({ page: this.data.page + 1 });
    this.loadTasks(true);
  },

  onTaskTap(e) {
    const { task } = e.detail;
    if (!task) return;
    this.setData({ showDetail: true, detailTask: task });
  },

  onCloseDetail() {
    this.setData({ showDetail: false });
  },

  async onDeleteTask() {
    const task = this.data.detailTask;
    wx.showModal({
      title: '删除任务',
      content: `确定要删除「${task.title}」吗？\n此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#FF3B30',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await deleteTask(task._id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.setData({ showDetail: false });
          this.loadTasks();
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' });
        }
      }
    });
  },

  onCreateTask() {
    const childId = this.data.activeChildId;
    if (!childId) {
      wx.showToast({ title: '请先添加孩子', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/task-create/task-create?childId=${childId}` });
  }
});
