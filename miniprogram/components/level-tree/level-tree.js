const { levelProgress, getLevelInfo } = require('../../utils/util');

Component({
  properties: {
    totalPoints: { type: Number, value: 0 },
    level: { type: Number, value: 1 },
    child: { type: Object, value: {} }
  },

  data: {
    levelInfo: {},
    progress: { percent: 0, pointsToNext: 0 }
  },

  observers: {
    'totalPoints, level': function (totalPoints) {
      const progress = levelProgress(totalPoints);
      const levelInfo = getLevelInfo(progress.level);
      this.setData({ progress, levelInfo: levelInfo || {} });
      // 重绘进度环
      this.drawRing(progress.percent);
    }
  },

  lifetimes: {
    ready() {
      // 初始绘制
      const progress = levelProgress(this.properties.totalPoints);
      this.drawRing(progress.percent);
    }
  },

  methods: {
    drawRing(percent) {
      const query = this.createSelectorQuery().in(this);
      query.select('#progressCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');

          const dpr = wx.getSystemInfoSync().pixelRatio;
          const size = res[0].width;
          canvas.width = size * dpr;
          canvas.height = size * dpr;
          ctx.scale(dpr, dpr);

          const centerX = size / 2;
          const centerY = size / 2;
          const radius = size / 2 - 6;
          const lineWidth = 8;

          ctx.clearRect(0, 0, size, size);

          // 背景环（灰色）
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = '#F0F0F0';
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.stroke();

          // 进度环（绿色渐变）
          if (percent > 0) {
            const startAngle = -Math.PI / 2; // 从顶部开始
            const endAngle = startAngle + (percent / 100) * 2 * Math.PI;

            // 创建渐变色
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#58CC02');
            gradient.addColorStop(1, '#1CB0F6');

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        });
    }
  }
});
