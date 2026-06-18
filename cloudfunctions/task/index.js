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
      case 'create':   return await create(family._id, event);
      case 'update':   return await updateTask(family._id, event);
      case 'delete':   return await deleteTask(family._id, event);
      case 'complete': return await complete(family._id, event);
      case 'list':     return await listTasks(family._id, event);
      case 'getToday': return await getToday(family._id, event);
      case 'get':      return await getTask(family._id, event);
      case 'propose':          return await propose(family._id, event);
      case 'approveProposal':  return await approveProposal(family._id, event);
      case 'getProposals':     return await getProposals(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('task error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where(_.or([{ members: openid }, { openid }])).get();
  return res.data[0] || null;
}

async function create(familyId, event) {
  const { childId, title, description, category, basePoints, taskType, isSelfChallenge, goal } = event;
  const task = {
    familyId,
    childId,
    title,
    description: description || '',
    category: category || 'sport',
    basePoints: isSelfChallenge ? 0 : (basePoints || 10),
    taskType: taskType || 'daily',
    status: 'pending',
    score: null,
    pointsAwarded: null,
    completedAt: null,
    isSelfChallenge: !!isSelfChallenge,
    goal: goal || '',
    createdAt: new Date()
  };
  const res = await db.collection('tasks').add({ data: task });
  task._id = res._id;
  return { code: 0, task };
}

async function updateTask(familyId, event) {
  const { taskId, title, description, category, basePoints, taskType } = event;
  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (category !== undefined) data.category = category;
  if (basePoints !== undefined) data.basePoints = basePoints;
  if (taskType !== undefined) data.taskType = taskType;

  await db.collection('tasks').doc(taskId).update({ data });
  const task = await db.collection('tasks').doc(taskId).get();
  return { code: 0, task: task.data };
}

async function deleteTask(familyId, event) {
  await db.collection('tasks').doc(event.taskId).remove();
  return { code: 0, success: true };
}

async function complete(familyId, event) {
  const { taskId, score } = event;

  // 获取家庭配置
  const configRes = await db.collection('familyConfig').where({ familyId }).get();
  const config = configRes.data[0] || { scoreMultipliers: { '3': 1.5, '2': 1.0, '1': 0.6 } };
  const multipliers = (config.scoreMultipliers && config.scoreMultipliers['5'] !== undefined)
    ? { '3': 1.5, '2': 1.0, '1': 0.6 }
    : config.scoreMultipliers;
  const multiplier = multipliers[String(score)] || 1.0;

  // 获取任务
  const task = await db.collection('tasks').doc(taskId).get();
  if (!task.data) return { code: 404, message: '任务不存在' };
  if (task.data.status === 'completed') return { code: 400, message: '任务已完成' };

  const isSelfChallenge = task.data.isSelfChallenge;
  const pointsAwarded = isSelfChallenge ? 0 : Math.round(task.data.basePoints * multiplier);
  const today = formatDate(new Date());

  // 更新任务
  await db.collection('tasks').doc(taskId).update({
    data: {
      status: 'completed',
      score,
      pointsAwarded,
      completedAt: new Date()
    }
  });

  // 更新孩子数据
  const child = await db.collection('children').doc(task.data.childId).get();
  const newTotal = isSelfChallenge ? (child.data.totalPointsEarned || 0) : (child.data.totalPointsEarned + pointsAwarded);
  const newCurrent = isSelfChallenge ? (child.data.currentPoints || 0) : (child.data.currentPoints + pointsAwarded);
  const newLevel = calcLevel(newTotal);
  const oldLevel = child.data.level || 1;
  const leveledUp = newLevel > oldLevel;
  const newStreak = calcStreak(child.data, today);
  const streakMilestone = (newStreak === 7 || newStreak === 30) ? newStreak : 0;

  await db.collection('children').doc(task.data.childId).update({
    data: {
      totalPointsEarned: newTotal,
      currentPoints: newCurrent,
      level: newLevel,
      streakDays: newStreak,
      lastActiveDate: today,
      totalTasksCompleted: (child.data.totalTasksCompleted || 0) + 1
    }
  });

  // 积分流水（自主挑战不产生积分记录，但记录特殊事件）
  if (isSelfChallenge) {
    await db.collection('pointRecords').add({
      data: {
        familyId,
        childId: task.data.childId,
        amount: 0,
        type: 'self_challenge',
        relatedTaskId: taskId,
        balanceAfter: newCurrent,
        note: `自主挑战完成: ${task.data.title}${task.data.goal ? ' - ' + task.data.goal : ''}`,
        createdAt: new Date()
      }
    });
  } else {
    await db.collection('pointRecords').add({
      data: {
        familyId,
        childId: task.data.childId,
        amount: pointsAwarded,
        type: 'task_complete',
        relatedTaskId: taskId,
        relatedDrawId: null,
        balanceAfter: newCurrent,
        note: `完成任务: ${task.data.title}`,
        createdAt: new Date()
      }
    });
  }

  // 检查成就（异步调用，不阻塞返回）
  try {
    await cloud.callFunction({
      name: 'achievement',
      data: { action: 'checkAndAward', childId: task.data.childId }
    });
  } catch (e) {
    console.error('成就检查失败:', e);
  }

  return {
    code: 0,
    task: { ...task.data, status: 'completed', score, pointsAwarded },
    pointsAwarded,
    newTotal,
    newCurrent,
    newLevel,
    oldLevel,
    leveledUp,
    streakMilestone
  };
}

async function listTasks(familyId, event) {
  const { childId, category, status, taskType, date, page = 1, pageSize = 20 } = event;
  const conditions = { familyId };
  if (childId) conditions.childId = childId;
  if (category && category !== 'all') conditions.category = category;
  if (status && status !== 'all') conditions.status = status;
  if (taskType === 'daily') { conditions.taskType = 'daily'; }
  else if (taskType === 'special') { conditions.taskType = 'special'; }

  const query = db.collection('tasks').where(conditions);
  const totalRes = await query.count();

  const res = await query
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  return { code: 0, tasks: res.data, total: totalRes.total };
}

async function getToday(familyId, event) {
  const { childId } = event;
  const today = formatDate(new Date());
  const todayStart = new Date(today + 'T00:00:00+08:00');
  const todayEnd = new Date(today + 'T23:59:59+08:00');

  const base = { familyId };
  if (childId) base.childId = childId;

  // 日常任务（含无 taskType 的旧数据）
  const dailyRes = await db.collection('tasks')
    .where(_.and([base, _.or([{ taskType: 'daily' }, { taskType: _.exists(false) }])]))
    .orderBy('createdAt', 'desc')
    .get();

  // 未完成的特殊任务
  const specialPendingRes = await db.collection('tasks')
    .where({ ...base, taskType: 'special', status: 'pending' })
    .orderBy('createdAt', 'desc')
    .get();

  // 今天完成的特殊任务
  const specialCompletedRes = await db.collection('tasks')
    .where({
      ...base,
      taskType: 'special',
      status: 'completed',
      completedAt: _.gte(todayStart).and(_.lte(todayEnd))
    })
    .orderBy('createdAt', 'desc')
    .get();

  const tasks = [...dailyRes.data, ...specialPendingRes.data, ...specialCompletedRes.data];

  return { code: 0, tasks };
}

async function getTask(familyId, event) {
  const res = await db.collection('tasks').doc(event.taskId).get();
  return { code: 0, task: res.data };
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcLevel(totalPoints) {
  const thresholds = [0, 100, 300, 600, 1000, 1500];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalPoints >= thresholds[i]) { level = i + 1; break; }
  }
  return level;
}

function calcStreak(child, today) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  if (child.lastActiveDate === today) return child.streakDays || 0;
  if (child.lastActiveDate === yesterdayStr) return (child.streakDays || 0) + 1;
  return 1;
}

// 孩子提议任务
async function propose(familyId, event) {
  const { childId, title, category, description } = event;
  if (!childId || !title || !category) return { code: 400, message: '请填写任务标题和分类' };

  const task = {
    familyId, childId,
    title,
    description: description || '',
    category,
    basePoints: 0,
    taskType: 'special',
    status: 'proposed',
    isSelfChallenge: false,
    createdAt: new Date()
  };
  const res = await db.collection('tasks').add({ data: task });
  return { code: 0, task: { _id: res._id, ...task } };
}

// 家长批准提议
async function approveProposal(familyId, event) {
  const { taskId, basePoints, title } = event;
  if (!taskId) return { code: 400, message: '缺少任务ID' };

  const existing = await db.collection('tasks').doc(taskId).get();
  if (!existing.data) return { code: 404, message: '任务不存在' };
  if (existing.data.status !== 'proposed') return { code: 400, message: '只能批准提议中的任务' };

  const updateData = {
    status: 'pending',
    basePoints: basePoints || 5,
    updatedAt: new Date()
  };
  if (title) updateData.title = title;

  await db.collection('tasks').doc(taskId).update({ data: updateData });
  const updated = await db.collection('tasks').doc(taskId).get();
  return { code: 0, task: updated.data };
}

// 获取提议列表
async function getProposals(familyId, event) {
  const { childId } = event;
  const conditions = { familyId, status: 'proposed' };
  if (childId) conditions.childId = childId;

  const res = await db.collection('tasks')
    .where(conditions)
    .orderBy('createdAt', 'desc')
    .get();
  return { code: 0, proposals: res.data };
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
