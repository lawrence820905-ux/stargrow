const { createChild, updateChild, removeChild, refreshChildren } = require('../../services/childService');
const app = getApp();

Page({
  data: {
    children: [],
    showModal: false,
    editingChild: null,
    childName: '',
    childAge: ''
  },

  async onLoad() {
    this.setData({ children: app.globalData.children });
  },

  onAdd() {
    this.setData({ showModal: true, editingChild: null, childName: '', childAge: '' });
  },

  onEdit(e) {
    const child = e.currentTarget.dataset.child;
    this.setData({ showModal: true, editingChild: child, childName: child.name, childAge: child.age || '' });
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const res = await new Promise(r => wx.showModal({ title: '确认删除', content: '删除后无法恢复', success: r }));
    if (!res.confirm) return;
    try {
      await removeChild(id);
      await refreshChildren();
      this.setData({ children: app.globalData.children });
      wx.showToast({ title: '已删除', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  onNameInput(e) { this.setData({ childName: e.detail.value }); },
  onAgeInput(e) { this.setData({ childAge: e.detail.value }); },

  onCloseModal() { this.setData({ showModal: false }); },

  async onConfirmModal() {
    const name = this.data.childName.trim();
    if (!name) { wx.showToast({ title: '请输入名称', icon: 'none' }); return; }
    const age = parseInt(this.data.childAge) || 0;
    try {
      if (this.data.editingChild) {
        await updateChild(this.data.editingChild._id, name, undefined, age);
      } else {
        await createChild(name, undefined, age);
      }
      await refreshChildren();
      this.setData({ children: app.globalData.children, showModal: false });
      wx.showToast({ title: '成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  }
});
