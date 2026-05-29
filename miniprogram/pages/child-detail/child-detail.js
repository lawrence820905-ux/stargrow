const app = getApp();

Page({
  data: {
    navBarTop: 88,
    children: [],
    activeChildId: '',
    child: {}
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ navBarTop: (sysInfo.statusBarHeight || 20) + 88 });
    this.setData({ children: app.globalData.children });
    const activeChild = app.getActiveChild();
    if (activeChild) {
      this.setData({ activeChildId: activeChild._id, child: activeChild });
    }
  },

  onChildChange(e) {
    const { childId } = e.detail;
    app.setActiveChild(childId);
    const child = app.getActiveChild();
    this.setData({ activeChildId: childId, child: child || {} });
  }
});
