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
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('stats error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where({ openid }).get();
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

  const specialCountRes = await db.collection('tasks')
    .where(_.and([
      { familyId, childId, taskType: 'special' },
      _.or([{ status: 'pending' }, { status: 'completed', completedAt: _.gte(todayStart).and(_.lte(todayEnd)) }])
    ]))
    .count();

  const todayTasksTotal = dailyCountRes.total + specialCountRes.total;

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

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
