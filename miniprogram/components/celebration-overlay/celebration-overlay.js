Component({
  properties: {
    visible: { type: Boolean, value: false },
    icon: { type: String, value: '🎉' },
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' }
  },

  data: {
    animating: false
  },

  observers: {
    'visible'(val) {
      if (val) {
        this.setData({ animating: true });
        // 3秒后自动关闭
        setTimeout(() => {
          this.setData({ animating: false });
          setTimeout(() => {
            this.triggerEvent('close');
          }, 300);
        }, 3000);
      }
    }
  },

  methods: {
    onTap() {
      this.setData({ animating: false });
      setTimeout(() => {
        this.triggerEvent('close');
      }, 300);
    }
  }
});
