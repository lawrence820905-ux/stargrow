Component({
  properties: {
    current: { type: Number, value: 0 },
    total: { type: Number, value: 1 },
    size: { type: Number, value: 200 },
    color: { type: String, value: '#007AFF' }
  },

  lifetimes: {
    attached() {
      this.draw();
    }
  },

  observers: {
    'current, total': function () {
      this.draw();
    }
  },

  methods: {
    draw() {
      const query = this.createSelectorQuery();
      query.select('#ring-canvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const size = this.properties.size;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const r = size / 2 - 8;
        const lineWidth = 10;
        const percent = Math.min(1, Math.max(0, this.properties.current / (this.properties.total || 1)));

        // Background ring
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#E5E5EA';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Progress ring
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
        ctx.strokeStyle = this.properties.color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
    }
  }
});
