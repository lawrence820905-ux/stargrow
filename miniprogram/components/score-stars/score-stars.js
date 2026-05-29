Component({
  properties: {
    score: { type: Number, value: 0 },
    readonly: { type: Boolean, value: false }
  },

  data: {
    options: [
      { score: 1, label: '马马虎虎', subtext: '仅得0.6倍积分', icon: '😐', multiplier: 0.6 },
      { score: 2, label: '达成目标', subtext: '获得标准积分',   icon: '👍', multiplier: 1.0 },
      { score: 3, label: '棒极了',   subtext: '获得1.5倍积分', icon: '🎉', multiplier: 1.5 }
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
