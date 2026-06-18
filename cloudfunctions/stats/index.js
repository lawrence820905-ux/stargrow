const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const family = await getFamilyByOpenid(OPENID);
    if (!family) return { code: 401, message: '未找到家庭' };

    switch (action) {
      case 'getChildOverview':      return await getChildOverview(family._id, event);
      case 'getWeeklyChart':        return await getWeeklyChart(family._id, event);
      case 'getCategoryBreakdown':  return await getCategoryBreakdown(family._id, event);
      case 'getLeaderboard':        return await getLeaderboard(family._id, event);
      case 'getFamilyGarden':      return await getFamilyGarden(family._id, event);
      case 'getSuperpower':        return await getSuperpower(family._id, event);
      case 'cheerSibling':         return await cheerSibling(family._id, event);
      case 'getPointHistory':       return await getPointHistory(family._id, event);
      case 'getMotivationInsight': return await getMotivationInsight(family._id, event);
      case 'getWeeklyComparison':  return await getWeeklyComparison(family._id, event);
      case 'getPendingPromises':  return await getPendingPromises(family._id, event);
      case 'generateGrowthStory': return await generateGrowthStory(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('stats error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where(_.or([{ members: openid }, { openid }])).get();
  return res.data[0] || null;
}

async function getChildOverview(familyId, event) {
  const { childId } = event;
  const child = await db.collection('children').doc(childId).get();

  // 本周任务数
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekTasksRes = await db.collection('tasks')
    .where({
      familyId,
      childId,
      status: 'completed',
      completedAt: _.gte(startOfWeek)
    })
    .count();

  // 今日任务（日常任务 + 未完成/今天完成的特殊任务）
  const todayStr = formatDate(today);
  const todayStart = new Date(todayStr + 'T00:00:00+08:00');
  const todayEnd = new Date(todayStr + 'T23:59:59+08:00');

  const dailyCountRes = await db.collection('tasks')
    .where(_.and([{ familyId, childId }, _.or([{ taskType: 'daily' }, { taskType: _.exists(false) }])]))
    .count();

  const specialTodayRes = await db.collection('tasks')
    .where({ familyId, childId, taskType: 'special', createdAt: _.gte(todayStart).and(_.lte(todayEnd)) })
    .count();

  const todayTasksTotal = dailyCountRes.total + specialTodayRes.total;

  const todayCompletedRes = await db.collection('tasks')
    .where({
      familyId,
      childId,
      status: 'completed',
      completedAt: _.gte(todayStart).and(_.lte(todayEnd))
    })
    .count();

  // 最近抽奖记录
  const recentDrawsRes = await db.collection('drawRecords')
    .where({ familyId, childId })
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  // 最近成就
  const recentAchievementsRes = await db.collection('achievements')
    .where({ familyId, childId })
    .orderBy('earnedAt', 'desc')
    .limit(5)
    .get();

  return {
    code: 0,
    overview: {
      child: child.data,
      thisWeekTasks: weekTasksRes.total,
      todayTasks: todayTasksTotal,
      todayCompleted: todayCompletedRes.total,
      recentDraws: recentDrawsRes.data,
      recentAchievements: recentAchievementsRes.data
    }
  };
}

async function getWeeklyChart(familyId, event) {
  const { childId, weeks = 8 } = event;
  const labels = [];
  const completedData = [];
  const pointsData = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const conditions = { familyId, status: 'completed', completedAt: _.gte(weekStart).and(_.lte(weekEnd)) };
    if (childId) conditions.childId = childId;

    const tasksRes = await db.collection('tasks').where(conditions).get();
    const count = tasksRes.data.length;
    const points = tasksRes.data.reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);

    labels.push(`${weekStart.getMonth() + 1}/${weekStart.getDate()}`);
    completedData.push(count);
    pointsData.push(points);
  }

  return { code: 0, labels, completedData, pointsData };
}

async function getCategoryBreakdown(familyId, event) {
  const { childId } = event;
  const conditions = { familyId, status: 'completed' };
  if (childId) conditions.childId = childId;

  const sportRes = await db.collection('tasks').where({ ...conditions, category: _.in(['sport', 'homework']) }).count();
  const lifeRes = await db.collection('tasks').where({ ...conditions, category: _.in(['life', 'housework']) }).count();
  const studyRes = await db.collection('tasks').where({ ...conditions, category: 'study' }).count();

  return {
    code: 0,
    breakdown: {
      sport: sportRes.total,
      life: lifeRes.total,
      study: studyRes.total
    }
  };
}

async function getLeaderboard(familyId, event) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const childrenRes = await db.collection('children').where({ familyId }).get();
  const rankings = [];

  for (const child of childrenRes.data) {
    const tasksRes = await db.collection('tasks')
      .where({
        familyId,
        childId: child._id,
        status: 'completed',
        completedAt: _.gte(startOfWeek)
      })
      .get();

    const weekPoints = tasksRes.data.reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);
    rankings.push({ childId: child._id, name: child.name, avatarUrl: child.avatarUrl, weekPoints });
  }

  rankings.sort((a, b) => b.weekPoints - a.weekPoints);

  return { code: 0, rankings };
}

async function getPointHistory(familyId, event) {
  const { childId, page = 1, pageSize = 20 } = event;
  const conditions = { familyId };
  if (childId) conditions.childId = childId;

  const totalRes = await db.collection('pointRecords').where(conditions).count();
  const res = await db.collection('pointRecords')
    .where(conditions)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  return { code: 0, records: res.data, total: totalRes.total };
}

async function getMotivationInsight(familyId, event) {
  const { childId } = event;
  if (!childId) return { code: 400, message: '缺少孩子ID' };

  const alerts = [];
  const today = new Date();
  const days = [];

  // 统计过去7天每天的任务完成情况
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const totalRes = await db.collection('tasks')
      .where(_.and([
        { familyId, childId },
        _.or([{ taskType: 'daily' }, { taskType: _.exists(false) }])
      ]))
      .count();

    // 当天完成的日常任务
    const completedRes = await db.collection('tasks')
      .where({
        familyId, childId, status: 'completed',
        completedAt: _.gte(dayStart).and(_.lte(dayEnd))
      })
      .get();
    const dailyCompleted = completedRes.data.filter(t => t.taskType === 'daily' || !t.taskType).length;

    if (totalRes.total > 0) {
      days.push({
        date: formatDate(dayStart),
        total: totalRes.total,
        completed: dailyCompleted,
        rate: dailyCompleted / totalRes.total
      });
    }
  }

  if (days.length >= 7) {
    const last7 = days.slice(-7);
    const allFull = last7.every(d => d.rate >= 1.0);
    if (allFull) {
      alerts.push({
        type: 'increase_difficulty',
        message: '孩子已连续7天完成所有任务！建议适当提高任务难度或增加任务数量。',
        severity: 'suggestion'
      });
    }
  }

  const last3 = days.slice(-3);
  if (last3.length >= 3 && last3.every(d => d.rate === 0) && last3.every(d => d.total > 0)) {
    alerts.push({
      type: 'decrease_difficulty',
      message: '孩子已连续3天未完成任何任务，建议降低难度或与孩子沟通原因。',
      severity: 'warning'
    });
  }

  // 3. 类别失衡检测：某一类过度聚焦
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const recentTasks = await db.collection('tasks')
    .where({ familyId, childId, status: 'completed', completedAt: _.gte(weekStart) })
    .get();
  const catCount = { sport: 0, life: 0, study: 0 };
  recentTasks.data.forEach(t => {
    const cat = t.category || 'study';
    if (catCount.hasOwnProperty(cat)) catCount[cat]++;
  });
  const totalRecent = catCount.sport + catCount.life + catCount.study;
  if (totalRecent >= 10) {
    for (const [cat, count] of Object.entries(catCount)) {
      const ratio = count / totalRecent;
      if (ratio > 0.7) {
        const catNames = { sport: '运动', life: '生活', study: '学习' };
        alerts.push({
          type: 'category_imbalance',
          message: `最近一周${catNames[cat]}任务占了${Math.round(ratio * 100)}%，建议适当增加其他类型的任务，促进均衡发展。`,
          severity: 'suggestion'
        });
        break;
      }
    }
  }

  // 4. 倦怠预警：前一周 vs 后一周完成率下降超过 50%
  if (days.length >= 14) {
    const firstWeek = days.slice(-14, -7);
    const secondWeek = days.slice(-7);
    const fwRate = firstWeek.reduce((s, d) => s + d.rate, 0) / firstWeek.length;
    const swRate = secondWeek.reduce((s, d) => s + d.rate, 0) / secondWeek.length;
    if (fwRate > 0.5 && swRate < fwRate * 0.5) {
      alerts.push({
        type: 'burnout_warning',
        message: '近两周任务完成率有明显下降趋势，孩子可能需要一个"休息周"或者调整任务节奏。不妨和孩子聊聊最近的感受~',
        severity: 'warning'
      });
    }
  }

  // 5. 努力一致性：连续 5+ 天保持稳定完成率
  if (days.length >= 5) {
    const last5 = days.slice(-5);
    const consistent = last5.every(d => d.rate >= 0.5);
    if (consistent && last5.some(d => d.rate >= 0.6)) {
      alerts.push({
        type: 'effort_consistency',
        message: '孩子最近保持稳定的努力节奏，这种持之以恒的品质值得一个大大的表扬！🌟',
        severity: 'positive'
      });
    }
  }

  // 6. 自主性增长：检查最近的自主挑战和任务提议
  const selfChallengeRes = await db.collection('tasks')
    .where({ familyId, childId, isSelfChallenge: true, status: 'completed' })
    .count();
  const proposalRes = await db.collection('tasks')
    .where({ familyId, childId, status: 'proposed' })
    .count();
  if (selfChallengeRes.total > 0 || proposalRes.total > 0) {
    alerts.push({
      type: 'autonomy_growth',
      message: `孩子已经发起了${selfChallengeRes.total + proposalRes.total}次自主行动（自主挑战或任务提议），这是内在动力的珍贵萌芽！🌱`,
      severity: 'positive'
    });
  }

  return { code: 0, alerts };
}

async function getWeeklyComparison(familyId, event) {
  const { childId } = event;
  if (!childId) return { code: 400, message: '缺少孩子ID' };

  const today = new Date();

  function getWeekRange(offset) {
    const dayOfWeek = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1 + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }

  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(-1);

  async function getWeekStats(start, end) {
    const tasksRes = await db.collection('tasks')
      .where({
        familyId, childId, status: 'completed',
        completedAt: _.gte(start).and(_.lte(end))
      })
      .get();
    const tasksCompleted = tasksRes.data.length;
    const pointsEarned = tasksRes.data.reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);
    const categories = {};
    tasksRes.data.forEach(t => {
      const cat = t.category || 'other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    let topCategory = '无';
    let topCount = 0;
    Object.entries(categories).forEach(([cat, count]) => {
      if (count > topCount) { topCategory = cat; topCount = count; }
    });
    return { tasksCompleted, pointsEarned, topCategory };
  }

  const [thisWeekStats, lastWeekStats] = await Promise.all([
    getWeekStats(thisWeek.start, thisWeek.end),
    getWeekStats(lastWeek.start, lastWeek.end)
  ]);

  const tasksChange = thisWeekStats.tasksCompleted - lastWeekStats.tasksCompleted;
  const pointsChange = thisWeekStats.pointsEarned - lastWeekStats.pointsEarned;

  let trend = 'stable';
  if (tasksChange > 0) trend = 'up';
  else if (tasksChange < 0) trend = 'down';

  return {
    code: 0,
    comparison: {
      thisWeek: thisWeekStats,
      lastWeek: lastWeekStats,
      tasksChange,
      pointsChange,
      trend
    }
  };
}

// 家庭花园：非排名式的兄弟姐妹生长可视化
async function getFamilyGarden(familyId, event) {
  const childrenRes = await db.collection('children').where({ familyId }).get();
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const garden = [];
  for (const child of childrenRes.data) {
    const tasksRes = await db.collection('tasks')
      .where({
        familyId, childId: child._id, status: 'completed',
        completedAt: _.gte(startOfWeek)
      })
      .get();
    const weekPoints = tasksRes.data.reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);
    const weekTasks = tasksRes.data.length;

    // 植物阶段基于累计积分（不是本周积分，反映整体成长）
    let plantStage = 1;
    if (child.totalPointsEarned >= 1500) plantStage = 6;
    else if (child.totalPointsEarned >= 1000) plantStage = 5;
    else if (child.totalPointsEarned >= 600) plantStage = 4;
    else if (child.totalPointsEarned >= 300) plantStage = 3;
    else if (child.totalPointsEarned >= 100) plantStage = 2;

    const plantEmojis = ['', '🌰', '🌱', '🌿', '🌳', '🌸', '🌟'];

    garden.push({
      childId: child._id,
      name: child.name,
      level: child.level || 1,
      plantStage,
      plantEmoji: plantEmojis[plantStage] || '🌱',
      weekPoints,
      weekTasks,
      totalPoints: child.totalPointsEarned || 0,
      streakDays: child.streakDays || 0
    });
  }

  return { code: 0, garden };
}

// 超能力：找到本周进步最大的领域
async function getSuperpower(familyId, event) {
  const { childId } = event;
  if (!childId) return { code: 400, message: '缺少孩子ID' };

  const today = new Date();

  // 本周
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay() + 1);
  thisWeekStart.setHours(0, 0, 0, 0);

  // 上周
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);

  async function getCatCounts(start, end) {
    const tasksRes = await db.collection('tasks')
      .where({
        familyId, childId, status: 'completed',
        completedAt: _.gte(start).and(_.lte(end))
      })
      .get();
    const cats = { sport: 0, life: 0, study: 0 };
    tasksRes.data.forEach(t => {
      const cat = t.category || 'study';
      if (cats.hasOwnProperty(cat)) cats[cat]++;
    });
    return cats;
  }

  const thisWeek = await getCatCounts(thisWeekStart, today);
  const lastWeek = await getCatCounts(lastWeekStart, lastWeekEnd);

  const catNames = { sport: '运动', life: '生活', study: '学习' };
  const catIcons = { sport: '⚽', life: '🏠', study: '📚' };

  let superpower = null;
  let maxImprovement = -Infinity;

  for (const cat of ['sport', 'life', 'study']) {
    const improvement = thisWeek[cat] - lastWeek[cat];
    if (improvement > maxImprovement) {
      maxImprovement = improvement;
      superpower = {
        category: cat,
        name: catNames[cat],
        icon: catIcons[cat],
        thisWeek: thisWeek[cat],
        lastWeek: lastWeek[cat],
        improvement
      };
    }
  }

  // 如果所有类别都一样，用最高完成数的
  if (maxImprovement <= 0) {
    for (const cat of ['sport', 'life', 'study']) {
      if (thisWeek[cat] > 0 && (!superpower || thisWeek[cat] > superpower.thisWeek)) {
        superpower = {
          category: cat,
          name: catNames[cat],
          icon: catIcons[cat],
          thisWeek: thisWeek[cat],
          lastWeek: lastWeek[cat],
          improvement: 0
        };
      }
    }
  }

  if (!superpower) {
    superpower = { category: 'study', name: '学习', icon: '📚', thisWeek: 0, lastWeek: 0, improvement: 0 };
  }

  // 生成鼓励文案
  let message = '';
  if (superpower.improvement > 0) {
    message = `你这周在${superpower.name}方面进步最大！继续保持！`;
  } else if (superpower.thisWeek > 0) {
    message = `你这周在${superpower.name}方面最活跃，稳稳地前进中~`;
  } else {
    message = '新的开始，每个领域都等待你去探索！';
  }

  return { code: 0, superpower: { ...superpower, message } };
}

// 加油：孩子之间互相鼓励
async function cheerSibling(familyId, event) {
  const { fromChildId, toChildId } = event;
  if (!fromChildId || !toChildId) return { code: 400, message: '缺少孩子ID' };
  if (fromChildId === toChildId) return { code: 400, message: '不能给自己加油哦' };

  // 检查今日是否已经加过油
  const todayStr = formatDate(new Date());
  const existing = await db.collection('cheers')
    .where({ familyId, fromChildId, toChildId, date: todayStr })
    .get();
  if (existing.data.length > 0) return { code: 400, message: '今天已经为TA加油过了！' };

  // 创建加油记录
  await db.collection('cheers').add({
    data: { familyId, fromChildId, toChildId, date: todayStr, createdAt: new Date() }
  });

  // 给被加油的孩子 +1 积分
  const toChild = await db.collection('children').doc(toChildId).get();
  const newPoints = (toChild.data.currentPoints || 0) + 1;
  await db.collection('children').doc(toChildId).update({
    data: { currentPoints: newPoints }
  });

  // 积分流水
  await db.collection('pointRecords').add({
    data: {
      familyId,
      childId: toChildId,
      amount: 1,
      type: 'cheer',
      balanceAfter: newPoints,
      note: '来自家人的加油',
      createdAt: new Date()
    }
  });

  // 获取加油者名字
  const fromChild = await db.collection('children').doc(fromChildId).get();

  return {
    code: 0,
    message: `为${toChild.data.name}加油成功！+1积分`,
    cheerCount: 1
  };
}

// 生成成长故事（从任务+观察聚合叙事）
async function generateGrowthStory(familyId, event) {
  const { childId } = event;
  if (!childId) return { code: 400, message: '缺少孩子ID' };

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  // 本周完成的任务
  const tasksRes = await db.collection('tasks')
    .where({
      familyId, childId, status: 'completed',
      completedAt: _.gte(weekStart)
    })
    .get();

  // 本周观察记录
  const obsRes = await db.collection('observations')
    .where({
      familyId, childId,
      createdAt: _.gte(weekStart)
    })
    .get();

  // 按分类统计任务
  const catCounts = { sport: 0, life: 0, study: 0 };
  tasksRes.data.forEach(t => {
    const cat = t.category || 'study';
    if (catCounts.hasOwnProperty(cat)) catCounts[cat]++;
  });
  const totalTasks = tasksRes.data.length;

  // 生成叙事
  const catNames = { sport: '运动⚽', life: '生活🏠', study: '学习📚' };
  const parts = [];
  for (const [cat, name] of Object.entries(catNames)) {
    if (catCounts[cat] > 0) parts.push(`完成了${catCounts[cat]}次${name}任务`);
  }

  let story = '';
  if (totalTasks === 0) {
    story = '新的一周开始了，每个小小的努力都在让成长之树生根发芽。一起加油吧！🌱';
  } else {
    story = `这周你${parts.join('，')}。`;
    // 添加观察记录中的亮点
    const moods = obsRes.data.filter(o => o.mood === '🥰' || o.mood === '😊');
    if (moods.length > 0) {
      story += `还有${moods.length}个闪亮时刻被记录下来✨。`;
    }
    // 给鼓励
    if (totalTasks >= 10) {
      story += '你在坚持中不断进步，这份毅力比任何积分都珍贵！🌟';
    } else if (totalTasks >= 5) {
      story += '稳扎稳打的一周，继续保持这个节奏！💪';
    } else {
      story += '每一步都在成长，继续向前走吧！🌿';
    }
  }

  return {
    code: 0,
    story: {
      text: story,
      totalTasks,
      catCounts,
      observationCount: obsRes.data.length,
      weekLabel: `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${today.getMonth() + 1}/${today.getDate()}`
    }
  };
}

// 获取待兑现承诺
async function getPendingPromises(familyId, event) {
  const today = new Date();

  // 未兑现的抽奖记录
  const drawRes = await db.collection('drawRecords')
    .where({ familyId, isFulfilled: false })
    .get();

  // 未兑现的兑换记录
  const exchangeRes = await db.collection('exchangeRecords')
    .where({ familyId, isFulfilled: false })
    .get();

  const promises = [
    ...drawRes.data.map(r => ({
      id: r._id,
      type: 'draw',
      childId: r.childId,
      prizeName: r.prizeName,
      prizeType: r.prizeType,
      pointsSpent: r.pointsSpent,
      expectedFulfillBy: r.expectedFulfillBy || null,
      createdAt: r.createdAt,
      isOverdue: r.expectedFulfillBy ? new Date(r.expectedFulfillBy) < today : false,
      daysOverdue: r.expectedFulfillBy
        ? Math.ceil((today - new Date(r.expectedFulfillBy)) / (1000 * 60 * 60 * 24))
        : 0
    })),
    ...exchangeRes.data.map(r => ({
      id: r._id,
      type: 'exchange',
      childId: r.childId,
      prizeName: r.itemName,
      prizeType: 'exchange',
      pointsSpent: r.pointsSpent,
      expectedFulfillBy: r.expectedFulfillBy || null,
      createdAt: r.createdAt,
      isOverdue: r.expectedFulfillBy ? new Date(r.expectedFulfillBy) < today : false,
      daysOverdue: r.expectedFulfillBy
        ? Math.ceil((today - new Date(r.expectedFulfillBy)) / (1000 * 60 * 60 * 24))
        : 0
    }))
  ];

  // 填充孩子名字
  const childIds = [...new Set(promises.map(p => p.childId))];
  if (childIds.length > 0) {
    const childrenRes = await db.collection('children')
      .where({ _id: _.in(childIds) })
      .get();
    const childMap = {};
    childrenRes.data.forEach(c => { childMap[c._id] = c.name; });
    promises.forEach(p => { p.childName = childMap[p.childId] || ''; });
  }

  const overdueCount = promises.filter(p => p.isOverdue).length;
  const totalCount = promises.length;

  return { code: 0, promises, totalCount, overdueCount };
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
