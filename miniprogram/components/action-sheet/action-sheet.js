Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    showConfirm: { type: Boolean, value: true },
    confirmText: { type: String, value: '确认' },
    cancelText: { type: String, value: '取消' }
  },

  methods: {
    onConfirm() {
      this.triggerEvent('confirm');
    },
    onClose() {
      this.triggerEvent('close');
    }
  }
});
