const { levelProgress, getLevelInfo } = require('../../utils/util');

Component({
  properties: {
    totalPoints: { type: Number, value: 0 },
    level: { type: Number, value: 1 }
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
    }
  }
});
