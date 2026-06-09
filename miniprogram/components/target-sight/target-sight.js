Component({
  properties: {
    currentPoints: { type: Number, value: 0 },
    todayTasks: { type: Number, value: 0 },
    todayCompleted: { type: Number, value: 0 },
    todayMaxPoints: { type: Number, value: 0 },
    cheapestDrawCost: { type: Number, value: 20 },
    cheapestShopPrice: { type: Number, value: 50 },
    pointsToNextLevel: { type: Number, value: 0 }
  },

  data: {
    remainingPoints: 0,
    nearestGoal: 0,
    nearestGoalName: '',
    percent: 0
  },

  observers: {
    'currentPoints, todayTasks, todayMaxPoints, cheapestDrawCost, cheapestShopPrice, pointsToNextLevel'(
      currentPoints, todayTasks, todayMaxPoints, cheapestDrawCost, cheapestShopPrice, pointsToNextLevel
    ) {
      // 计算今日剩余可获积分
      const completedPoints = todayMaxPoints > 0 ? Math.round((todayTasks > 0 ? (currentPoints % todayMaxPoints) : 0)) : 0;
      const remainingPoints = Math.max(0, todayMaxPoints - completedPoints);

      // 找最近的目标
      const goals = [
        { name: '一次抽奖', cost: cheapestDrawCost || 20 },
        { name: '商城兑换', cost: cheapestShopPrice || 999 },
        { name: '下一等级', cost: pointsToNextLevel || 999 }
      ].filter(g => g.cost > 0);

      goals.sort((a, b) => a.cost - b.cost);
      const nearestGoal = goals[0] ? goals[0].cost : 100;
      const nearestGoalName = goals[0] ? goals[0].name : '目标';

      const percent = nearestGoal > 0 ? Math.min(100, Math.round((currentPoints / nearestGoal) * 100)) : 100;

      this.setData({
        remainingPoints,
        nearestGoal,
        nearestGoalName,
        percent
      });
    }
  }
});
