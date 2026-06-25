const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime, getNextLevelInfo } = require('../../utils/util');
const { getChildOverview, getMotivationInsight, getPendingPromises, generateGrowthStory } = require('../../services/statsService');
const { getPools } = require('../../services/drawService');
const { listItems } = require('../../services/shopService');
const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    loading: true,
    loadError: false,
    isFirstVisit: false,
    showWelcomeTip: false,
    joinCode: '',
    children: [],
    activeChildId: '',
    activeChild: {},
    todayTasks: 0,
    todayCompleted: 0,
    todayPercent: 0,
    todayTasksList: [],
    todayMaxPoints: 0,
    cheapestDrawCost: 20,
    cheapestShopPrice: 50,
    pointsToNextLevel: 0,
    recentDraws: [],
    motivationAlerts: [],
    pendingPromises: [],
    growthStory: null,
    growthStoryLoading: false,
    pointsAnimate: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: (sysInfo.statusBarHeight || 20) + 10 });
  },

  async onShow() {
    // 设置自定义 Tab Bar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 首次访问检测
    const hasVisited = wx.getStorageSync('idx_visited');
    if (!hasVisited) {
      this.setData({ isFirstVisit: true, showWelcomeTip: true });
    }
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, loadError: false });

    // 始终从云端刷新孩子列表，避免本地缓存过期导致数据不一致
    try {
      const { loadChildren } = require('../../utils/auth');
      await loadChildren();
    } catch (e) { /* ignore */ }

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

      // 计算今日最高可得积分
      const todayMaxPoints = tasksList
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + (t.basePoints || 0), 0);

      // 获取目标数据
      let cheapestDrawCost = 20;
      let cheapestShopPrice = 50;
      try {
        const [poolsResult, shopResult] = await Promise.all([
          getPools(),
          listItems()
        ]);
        if (poolsResult.smallPool) cheapestDrawCost = poolsResult.smallPool.cost || 20;
        if (poolsResult.bigPool && poolsResult.bigPool.cost < cheapestDrawCost) cheapestDrawCost = poolsResult.bigPool.cost;
        const shopItems = shopResult.items || [];
        if (shopItems.length > 0) {
          cheapestShopPrice = Math.min(...shopItems.map(i => i.price));
        }
      } catch (e) { /* 使用默认值 */ }

      // 距离下一级所需积分
      const childTotal = overview.child ? overview.child.totalPointsEarned || 0 : 0;
      const nextInfo = getNextLevelInfo(overview.child ? overview.child.level || 1 : 1);
      const pointsToNextLevel = nextInfo ? nextInfo.points - childTotal : 0;

      this.setData({
        activeChild: overview.child || {},
        todayTasks,
        todayCompleted,
        todayPercent,
        todayTasksList: tasksList,
        todayMaxPoints,
        cheapestDrawCost,
        cheapestShopPrice,
        pointsToNextLevel,
        recentDraws: overview.recentDraws || []
      });

      // 加载激励提示
      this.loadMotivationInsight(childId);
      // 加载待兑现承诺
      this.loadPendingPromises();
      // 加载成长故事
      this.loadGrowthStory(childId);
    } catch (err) {
      console.error('加载概览失败:', err);
      // 如果孩子已被删除，清理脏数据并刷新
      if (err.message && (err.message.includes('不存在') || err.message.includes('does not exist'))) {
        const { loadChildren } = require('../../utils/auth');
        try { await loadChildren(); } catch (e) { /* ignore */ }
        const allChildren = app.globalData.children;
        if (allChildren.length > 0) {
          const next = allChildren[0];
          app.setActiveChild(next._id);
          this.setData({ activeChildId: next._id, activeChild: next });
          this.loadOverview(next._id);
          return;
        }
        // 没有孩子了，清空状态
        app.setActiveChild('');
        this.setData({ activeChildId: '', activeChild: {}, loadError: false, loading: false });
        return;
      }
      this.setData({ loadError: true });
    }
  },

  async loadGrowthStory(childId) {
    try {
      this.setData({ growthStoryLoading: true });
      const result = await generateGrowthStory(childId);
      this.setData({ growthStory: result.story, growthStoryLoading: false });
    } catch (e) {
      this.setData({ growthStoryLoading: false });
    }
  },

  async loadPendingPromises() {
    try {
      const result = await getPendingPromises();
      this.setData({ pendingPromises: result.promises || [] });
    } catch (e) { /* 静默失败 */ }
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

  // 左右箭头切换孩子
  onPrevChild() {
    const { children, activeChildId } = this.data;
    if (children.length <= 1) return;
    const idx = children.findIndex(c => c._id === activeChildId);
    const prevIdx = idx <= 0 ? children.length - 1 : idx - 1;
    this.switchToChild(children[prevIdx]);
  },

  onNextChild() {
    const { children, activeChildId } = this.data;
    if (children.length <= 1) return;
    const idx = children.findIndex(c => c._id === activeChildId);
    const nextIdx = idx >= children.length - 1 ? 0 : idx + 1;
    this.switchToChild(children[nextIdx]);
  },

  switchToChild(child) {
    if (!child) return;
    app.setActiveChild(child._id);
    this.setData({
      activeChildId: child._id,
      activeChild: child
    });
    this.loadOverview(child._id);
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

  onStartOnboarding() {
    wx.navigateTo({ url: '/pages/child-manage/child-manage' });
  },

  onJoinInput(e) {
    this.setData({ joinCode: e.detail.value.toUpperCase() });
  },

  async onJoinFamily() {
    const code = this.data.joinCode.trim().toUpperCase();
    if (code.length < 6) {
      wx.showToast({ title: '请输入6位家庭码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加入中...' });
    try {
      const { joinFamily } = require('../../utils/auth');
      const family = await joinFamily(code);
      app.setFamily(family);
      await require('../../utils/auth').loadChildren();
      wx.hideLoading();
      wx.showToast({ title: '加入成功！', icon: 'success' });
      this.setData({ joinCode: '' });
      this.loadData();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '加入失败，请检查家庭码', icon: 'none' });
    }
  },

  onRetryLoad() {
    this.loadData();
  },

  onDismissWelcome() {
    wx.setStorageSync('idx_visited', true);
    this.setData({ showWelcomeTip: false, isFirstVisit: false });
  },

  onGoCreateTask() {
    const childId = this.data.activeChildId;
    if (!childId) {
      wx.showToast({ title: '请先添加孩子', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/task-create/task-create?childId=${childId}` });
  },

  onGoShop() {
    wx.navigateTo({ url: '/pages/shop/shop' });
  },

  onGoPromises() {
    wx.navigateTo({ url: '/pages/draw/draw' });
  },

  async loadMotivationInsight(childId) {
    try {
      const result = await getMotivationInsight(childId);
      const alerts = (result.alerts || []).filter(alert => {
        const key = `alert_dismissed_${alert.type}_${new Date().toDateString()}`;
        const dismissed = wx.getStorageSync(key);
        return !dismissed;
      });
      this.setData({ motivationAlerts: alerts });
    } catch (e) { /* 静默失败 */ }
  },

  onDismissAlert(e) {
    const { type } = e.currentTarget.dataset;
    const key = `alert_dismissed_${type}_${new Date().toDateString()}`;
    wx.setStorageSync(key, true);
    const alerts = this.data.motivationAlerts.filter(a => a.type !== type);
    this.setData({ motivationAlerts: alerts });
  },

  onShareAppMessage() {
    return {
      title: '成长派克 - 孩子激励成长好帮手',
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: '成长派克 - 孩子激励成长好帮手'
    };
  }
});
