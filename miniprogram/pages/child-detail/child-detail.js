const app = getApp();
const { listObservations, addObservation, deleteObservation } = require('../../services/observationService');
const { relativeTime } = require('../../utils/util');

Page({
  data: {
    children: [],
    activeChildId: '',
    child: {},
    observations: [],
    showAddObs: false,
    obsContent: '',
    obsMood: '',
    obsMoods: ['😊', '🥰', '😄', '🤩', '😌', '🎉'],
    obsBonus: 0,
    bonusOptions: [0, 5, 10, 20]
  },

  onLoad() {
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id, child: activeChild });
      this.loadObservations(activeChild._id);
    }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    const child = app.getActiveChild();
    this.setData({ activeChildId: childId, child: child || {} });
    this.loadObservations(childId);
  },

  async loadObservations(childId) {
    try {
      const result = await listObservations(childId);
      this.setData({
        observations: (result.observations || []).map(o => ({
          ...o,
          timeText: relativeTime(o.createdAt)
        }))
      });
    } catch (e) { /* ignore */ }
  },

  onShowAddObs() {
    this.setData({ showAddObs: true, obsContent: '', obsMood: '', obsBonus: 0 });
  },

  onCloseAddObs() {
    this.setData({ showAddObs: false });
  },

  onObsInput(e) {
    this.setData({ obsContent: e.detail.value });
  },

  onSelectMood(e) {
    this.setData({ obsMood: e.currentTarget.dataset.mood });
  },

  onSelectBonus(e) {
    this.setData({ obsBonus: parseInt(e.currentTarget.dataset.val) || 0 });
  },

  preventBubble() {},

  async onSubmitObs() {
    const content = this.data.obsContent.trim();
    if (!content) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    try {
      await addObservation(this.data.activeChildId, content, this.data.obsMood, [], this.data.obsBonus);
      wx.showToast({ title: this.data.obsBonus > 0 ? `记录成功！+${this.data.obsBonus}分` : '记录成功', icon: 'success' });
      this.setData({ showAddObs: false });
      this.loadObservations(this.data.activeChildId);
    } catch (err) {
      wx.showToast({ title: '记录失败', icon: 'none' });
    }
  },

  async onDeleteObs(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteObservation(id);
            this.loadObservations(this.data.activeChildId);
            wx.showToast({ title: '已删除', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
