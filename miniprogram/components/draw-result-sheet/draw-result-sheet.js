Component({
  properties: {
    visible: { type: Boolean, value: false },
    record: {
      type: Object,
      value: {
        pointsSpent: 0,
        pointsAwarded: 0,
        prizeName: '',
        prizeType: 'points',
        rewardTitle: ''
      }
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    }
  }
});
