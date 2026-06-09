Component({
  properties: {
    icon: { type: String, value: '📋' },
    text: { type: String, value: '暂无内容' },
    hint: { type: String, value: '' },
    actionText: { type: String, value: '' }
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    }
  }
});
