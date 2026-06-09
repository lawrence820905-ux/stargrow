Component({
  properties: {
    type: { type: String, value: 'info' },
    message: { type: String, value: '' },
    visible: { type: Boolean, value: true }
  },

  data: {
    icon: '💡',
    bgClass: ''
  },

  observers: {
    'type'(val) {
      const map = {
        suggestion: { icon: '💡', bg: 'alert-card--suggestion' },
        warning: { icon: '⚠️', bg: 'alert-card--warning' },
        info: { icon: 'ℹ️', bg: 'alert-card--info' }
      };
      const conf = map[val] || map.info;
      this.setData({ icon: conf.icon, bgClass: conf.bg });
    }
  },

  methods: {
    onDismiss() {
      this.triggerEvent('dismiss');
    }
  }
});
