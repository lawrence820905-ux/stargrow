const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const { getChildOverview } = require('../../services/statsService');
const app = getApp();

Page({
  data: {
    loading: true,
    statusBarHeight: 20,
    children: [],
    activeChildId: '',
    activeChild: {},
    todayTasks: 0,
    todayCompleted: 0,
    todayPercent: 0,
    todayTasksList: [],
    recentAchievements: [],
    recentDraws: [],
    pointsAnimate: false
  },

  async onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
  },

  async onShow() {
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });

    const children = app.globalData.children;
    if (children.length === 0) {
      try {
        const { loadChildren } = require('../../utils/auth');
        await loadChildren();
      } catch (e) { /* ignore */ }
    }

    const allChildren = app.globalData.children;
    let activeChild = app.getActiveChild();
    if (!activeChild && allChildren.length > 0) {
      activeChild = allChildren[0];
      app.setActiveChild(activeChild._id);
    }

    this.setData({
      children: allChildren,
      activeChildId: activeChild ? activeChild._id : '',
      activeChild: activeChild || {},
      loading: false
    });

    if (activeChild) {
      this.loadOverview(activeChild._id);
    }
  },

  async loadOverview(childId) {
    try {
      const result = await getChildOverview(childId);
      const { overview } = result;

      const todayTasksList = (overview.recentDraws || []).length > 0 ? [] : []; // Simplified
      const todayTasks = overview.todayTasks || 0;
      const todayCompleted = overview.todayCompleted || 0;
      const todayPercent = todayTasks > 0 ? Math.round((todayCompleted / todayTasks) * 100) : 0;

      // Fetch today's tasks
      const { getTodayTasks } = require('../../services/taskService');
      const todayResult = await getTodayTasks(childId);
      const tasksList = (todayResult.tasks || []).map(t => ({
        ...t,
        createdAtText: relativeTime(t.createdAt)
      }));

      this.setData({
        activeChild: overview.child || {},
        todayTasks,
        todayCompleted,
        todayPercent,
        todayTasksList: tasksList,
        recentAchievements: overview.recentAchievements || [],
        recentDraws: overview.recentDraws || []
      });
    } catch (err) {
      console.error('加载概览失败:', err);
    }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    const activeChild = app.getActiveChild();
    this.setData({
      activeChildId: childId,
      activeChild: activeChild || {}
    });
    this.loadOverview(childId);
  },

  onTaskTap(e) {
    const { task } = e.detail;
    if (!task) return;
    if (task.status === 'pending') {
      wx.navigateTo({ url: `/pages/task-complete/task-complete?taskId=${task._id}` });
    }
  },

  onGoTasks() {
    wx.switchTab({ url: '/pages/tasks/tasks' });
  },

  onGoAchievements() {
    const childId = this.data.activeChildId;
    wx.navigateTo({ url: `/pages/achievements/achievements?childId=${childId}` });
  },

  onAddChild() {
    wx.switchTab({ url: '/pages/settings/settings' });
  }
});
