Component({
  properties: {
    score: { type: Number, value: 0 },
    readonly: { type: Boolean, value: false }
  },

  data: {
    options: [
      { score: 1, label: '很努力了', subtext: '在提醒下完成，或真的尽力了', rubric: '努力', icon: '💪', multiplier: 0.6 },
      { score: 2, label: '做到了',   subtext: '自觉完成，达到目标',       rubric: '结果', icon: '✅', multiplier: 1.0 },
      { score: 3, label: '超越了',   subtext: '超出预期，让人惊喜',       rubric: '超越', icon: '🌟', multiplier: 1.5 }
    ]
  },

  methods: {
    onTap(e) {
      if (this.properties.readonly) return;
      const score = e.currentTarget.dataset.score;
      this.triggerEvent('change', { score });
      wx.vibrateShort({ type: 'light' });
    }
  }
});
