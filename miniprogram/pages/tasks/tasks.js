const { getChildren, getActiveChild } = require('../../utils/auth');
const { relativeTime } = require('../../utils/util');
const { listTasks, deleteTask, createTask, proposeTask } = require('../../services/taskService');
const app = getApp();

const categories = [
  { key: 'all', name: '全部', icon: '📋' },
  { key: 'sport', name: '运动', icon: '⚽' },
  { key: 'life', name: '生活', icon: '🏠' },
  { key: 'study', name: '学习', icon: '📚' }
];

// 按年龄分组的任务模板
const TASK_TEMPLATES = {
  '3-5': {
    sport: [
      { title: '跳绳10下', basePoints: 10 },
      { title: '拍球20个', basePoints: 10 },
      { title: '跟着音乐跳舞2分钟', basePoints: 10 },
      { title: '学小兔子跳10次', basePoints: 8 },
      { title: '平衡站立10秒', basePoints: 8 }
    ],
    life: [
      { title: '自己刷牙', basePoints: 10 },
      { title: '收拾玩具', basePoints: 10 },
      { title: '帮忙摆放碗筷', basePoints: 10 },
      { title: '自己穿衣服', basePoints: 10 },
      { title: '给植物浇水', basePoints: 8 }
    ],
    study: [
      { title: '看一本绘本', basePoints: 10 },
      { title: '认识3个新汉字', basePoints: 10 },
      { title: '数数1-20', basePoints: 10 },
      { title: '画一幅画', basePoints: 10 },
      { title: '唱一首儿歌', basePoints: 8 }
    ]
  },
  '6-8': {
    sport: [
      { title: '跳绳50下', basePoints: 10 },
      { title: '跑步10分钟', basePoints: 10 },
      { title: '仰卧起坐10个', basePoints: 10 },
      { title: '做一套广播体操', basePoints: 10 },
      { title: '踢毽子20个', basePoints: 8 }
    ],
    life: [
      { title: '整理书包', basePoints: 10 },
      { title: '自己叠被子', basePoints: 10 },
      { title: '扫地', basePoints: 10 },
      { title: '擦桌子', basePoints: 10 },
      { title: '给宠物喂食', basePoints: 8 }
    ],
    study: [
      { title: '朗读一篇课文', basePoints: 10 },
      { title: '写一篇日记', basePoints: 10 },
      { title: '做10道口算题', basePoints: 10 },
      { title: '背诵一首古诗', basePoints: 10 },
      { title: '练习写字15分钟', basePoints: 8 }
    ]
  },
  '9-11': {
    sport: [
      { title: '跳绳100下', basePoints: 10 },
      { title: '跑步15分钟', basePoints: 10 },
      { title: '俯卧撑10个', basePoints: 10 },
      { title: '蛙跳20次', basePoints: 10 },
      { title: '拉伸运动10分钟', basePoints: 8 }
    ],
    life: [
      { title: '洗碗', basePoints: 10 },
      { title: '整理自己房间', basePoints: 10 },
      { title: '倒垃圾', basePoints: 10 },
      { title: '帮忙准备食材', basePoints: 10 },
      { title: '叠衣服', basePoints: 8 }
    ],
    study: [
      { title: '背10个英语单词', basePoints: 10 },
      { title: '做一页数学题', basePoints: 10 },
      { title: '预习明天课程', basePoints: 10 },
      { title: '阅读课外书20分钟', basePoints: 10 },
      { title: '归纳今日笔记', basePoints: 8 }
    ]
  },
  '12+': {
    sport: [
      { title: '跑步20分钟', basePoints: 10 },
      { title: '跳绳150下', basePoints: 10 },
      { title: '俯卧撑15个', basePoints: 10 },
      { title: '平板支撑1分钟', basePoints: 10 },
      { title: '深蹲30个', basePoints: 8 }
    ],
    life: [
      { title: '做一道菜', basePoints: 10 },
      { title: '洗自己的衣服', basePoints: 10 },
      { title: '独立完成一项家务', basePoints: 10 },
      { title: '整理书桌和房间', basePoints: 10 },
      { title: '帮忙购物', basePoints: 8 }
    ],
    study: [
      { title: '背20个英语单词', basePoints: 10 },
      { title: '复习本周笔记', basePoints: 10 },
      { title: '读课外书30分钟', basePoints: 10 },
      { title: '做一套练习题', basePoints: 10 },
      { title: '写一篇短文', basePoints: 8 }
    ]
  }
};

function getRandomTasks(age) {
  // 确定年龄组
  let group;
  if (!age || age < 3) {
    // 未设置年龄，从所有模板中混合选取
    const allSport = [];
    const allLife = [];
    const allStudy = [];
    Object.values(TASK_TEMPLATES).forEach(g => {
      allSport.push(...g.sport);
      allLife.push(...g.life);
      allStudy.push(...g.study);
    });
    return pickTasks(allSport, allLife, allStudy);
  }
  if (age <= 5) group = '3-5';
  else if (age <= 8) group = '6-8';
  else if (age <= 11) group = '9-11';
  else group = '12+';

  const tpl = TASK_TEMPLATES[group];
  return pickTasks(tpl.sport, tpl.life, tpl.study);
}

function pickTasks(sport, life, study) {
  const pick = (arr, n) => {
    const shuffled = arr.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  };

  // 2运动 + 2生活 + 1学习 = 5个任务
  return [
    ...pick(sport, 2).map(t => ({ ...t, category: 'sport' })),
    ...pick(life, 2).map(t => ({ ...t, category: 'life' })),
    ...pick(study, 1).map(t => ({ ...t, category: 'study' }))
  ];
}

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
    detailTask: {},
    showPropose: false,
    proposeTitle: '',
    proposeCategory: 'study'
  },

  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
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
      wx.showToast({ title: '加载失败，请下拉重试', icon: 'none' });
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

  onEditTask() {
    const task = this.data.detailTask;
    if (!task || !task._id) return;
    this.setData({ showDetail: false });
    wx.navigateTo({ url: `/pages/task-create/task-create?taskId=${task._id}` });
  },

  async onDeleteTask() {
    const task = this.data.detailTask;
    wx.showModal({
      title: '删除任务',
      content: `确定要删除「${task.title}」吗？\n此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#FF4B4B',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await deleteTask(task._id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.setData({ showDetail: false });
          this.loadTasks();
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败，请稍后重试', icon: 'none' });
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
  },

  // 孩子提议任务
  onProposeTask() {
    const childId = this.data.activeChildId;
    if (!childId) {
      wx.showToast({ title: '请先添加孩子', icon: 'none' });
      return;
    }
    this.setData({ showPropose: true, proposeTitle: '', proposeCategory: 'study' });
  },

  onClosePropose() {
    this.setData({ showPropose: false });
  },

  onProposeTitleInput(e) {
    this.setData({ proposeTitle: e.detail.value });
  },

  onProposeCatChange(e) {
    this.setData({ proposeCategory: e.currentTarget.dataset.key });
  },

  async onSubmitPropose() {
    const childId = this.data.activeChildId;
    const title = this.data.proposeTitle.trim();
    const category = this.data.proposeCategory;
    if (!title) {
      wx.showToast({ title: '请填写任务名称', icon: 'none' });
      return;
    }
    try {
      await proposeTask(childId, title, category, '');
      wx.showToast({ title: '提议成功！等家长批准', icon: 'success' });
      this.setData({ showPropose: false });
      this.loadTasks();
    } catch (err) {
      wx.showToast({ title: err.message || '提议失败', icon: 'none' });
    }
  },

  async onRandomTasks() {
    const childId = this.data.activeChildId;
    if (!childId) {
      wx.showToast({ title: '请先添加孩子', icon: 'none' });
      return;
    }
    const activeChild = app.getActiveChild();
    const age = activeChild ? (activeChild.age || 0) : 0;

    const tasks = getRandomTasks(age);
    wx.showLoading({ title: '生成中...' });
    try {
      for (const t of tasks) {
        await createTask(childId, t.title, '', t.category, t.basePoints, 'daily');
      }
      wx.hideLoading();
      wx.showToast({ title: `已生成${tasks.length}个任务`, icon: 'success' });
      this.loadTasks();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    }
  }
});
