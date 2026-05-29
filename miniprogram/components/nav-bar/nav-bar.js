Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
    fixed: { type: Boolean, value: true },
    largeTitle: { type: Boolean, value: false }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 88
  },

  lifetimes: {
    attached() {
      const sysInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: sysInfo.statusBarHeight || 20,
        navBarHeight: 88
      });
    }
  },

  methods: {
    onBack() {
      this.triggerEvent('back');
      wx.navigateBack({ delta: 1 });
    }
  }
});
