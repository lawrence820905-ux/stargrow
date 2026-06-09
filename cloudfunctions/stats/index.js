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
      case 'getPointHistory':       return await getPointHistory(family._id, event);
      case 'getMotivationInsight': return await getMotivationInsight(family._id, event);
      case 'getWeeklyComparison':  return await getWeeklyComparison(family._id, event);
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

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
