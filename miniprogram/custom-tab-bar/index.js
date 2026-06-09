Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'home' },
      { pagePath: '/pages/tasks/tasks', text: '任务', icon: 'tasks' },
      { pagePath: '/pages/shop/shop', text: '商城', icon: 'shop' },
      { pagePath: '/pages/achievements/achievements', text: '成就', icon: 'achievements' },
      { pagePath: '/pages/settings/settings', text: '设置', icon: 'settings' }
    ]
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (this.data.selected === index) return;
      wx.switchTab({ url: path });
    }
  }
});
