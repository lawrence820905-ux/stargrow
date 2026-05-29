const theme = require('../../config/theme');

Component({
  properties: {
    items: { type: Array, value: [] },
    size: { type: Number, value: 560 },
    spinning: { type: Boolean, value: false }
  },

  data: {
    canvas: null,
    ctx: null,
    rotation: 0
  },

  lifetimes: {
    attached() {
      this.initCanvas();
    }
  },

  observers: {
    'items': function () {
      if (this.data.ctx) this.drawWheel();
    }
  },

  methods: {
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#wheel-canvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = this.properties.size * dpr;
        canvas.height = this.properties.size * dpr;
        ctx.scale(dpr, dpr);
        this.setData({ canvas, ctx });
        this.drawWheel();
      });
    },

    drawWheel() {
      const { ctx, size } = this.data;
      const items = this.properties.items;
      if (!ctx || !items.length) return;

      const r = size / 2;
      const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
      if (totalWeight <= 0) return;

      ctx.clearRect(0, 0, size, size);

      let startAngle = -Math.PI / 2;
      items.forEach((item, index) => {
        const sweep = (item.weight / totalWeight) * Math.PI * 2;
        const endAngle = startAngle + sweep;

        // 扇区
        ctx.beginPath();
        ctx.moveTo(r, r);
        ctx.arc(r, r, r - 4, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = this.getSectorColor(index);
        ctx.fill();

        // 文字
        const midAngle = startAngle + sweep / 2;
        const textR = r * 0.62;
        const tx = r + Math.cos(midAngle) * textR;
        const ty = r + Math.sin(midAngle) * textR;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon || '?', 0, -8);
        ctx.font = '10px -apple-system';
        ctx.fillText(item.name, 0, 14);
        ctx.restore();

        startAngle = endAngle;
      });
    },

    getSectorColor(index) {
      const colors = ['#FF9500', '#007AFF', '#34C759', '#AF52DE', '#FF3B30', '#5AC8FA', '#FFCC00', '#FF2D55'];
      return colors[index % colors.length];
    },

    spin(prizeIndex) {
      const items = this.properties.items;
      const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
      let cumulativeAngle = 0;
      for (let i = 0; i < prizeIndex; i++) {
        cumulativeAngle += (items[i].weight / totalWeight) * 360;
      }
      const prizeAngle = (items[prizeIndex].weight / totalWeight) * 360;
      const targetAngle = cumulativeAngle + prizeAngle / 2;

      // 转 5-8 圈 + 停止位置
      const spins = 5 + Math.random() * 3;
      const totalRotation = spins * 360 + (360 - targetAngle);

      this.setData({
        rotation: this.data.rotation + totalRotation,
        spinning: true
      });

      return new Promise(resolve => {
        setTimeout(() => {
          this.setData({ spinning: false });
          resolve();
        }, 3000);
      });
    }
  }
});
