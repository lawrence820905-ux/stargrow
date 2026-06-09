const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 内置成就定义
const BUILT_IN = [
  { key: 'first_task',     name: '初次成长',  description: '完成第一个任务',     icon: '🎯' },
  { key: 'ten_tasks',      name: '小能手',    description: '完成10个任务',       icon: '⭐' },
  { key: 'fifty_tasks',    name: '小达人',    description: '完成50个任务',       icon: '🏅' },
  { key: 'hundred_tasks',  name: '任务大师',  description: '完成100个任务',      icon: '👑' },
  { key: 'sport_20',       name: '运动达人',  description: '完成20个运动任务',   icon: '⚽' },
  { key: 'life_20',        name: '生活能手',  description: '完成20个生活任务',   icon: '🏠' },
  { key: 'study_20',       name: '学习之星',  description: '完成20个学习任务',   icon: '📚' },
  { key: 'streak_7',       name: '一周坚持',  description: '连续7天完成任务',    icon: '🔥' },
  { key: 'streak_30',      name: '一月坚持',  description: '连续30天完成任务',   icon: '💪' },
  { key: 'star_10',        name: '棒极了',    description: '获得10次棒极了评价',  icon: '✨' },
  { key: 'lucky_epic',     name: '欧皇附体',  description: '抽中传说级奖品',     icon: '🍀' },
  { key: 'level_3',        name: '小树成长',  description: '达到等级3',         icon: '🌿' },
  { key: 'level_5',        name: '开花结果',  description: '达到等级5',         icon: '🌸' },
  { key: 'points_1000',    name: '积分富翁',  description: '累计获得1000积分',   icon: '💰' },
  { key: 'draw_50',        name: '抽奖达人',  description: '累计抽奖50次',       icon: '🎰' }
];

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const family = await getFamilyByOpenid(OPENID);
    if (!family) return { code: 401, message: '未找到家庭' };

    switch (action) {
      case 'checkAndAward':    return await checkAndAward(family._id, event);
      case 'getAchievements':  return await getAchievements(family._id, event);
      case 'listCustom':       return await listCustom(family._id);
      case 'saveCustom':       return await saveCustom(family._id, event);
      case 'deleteCustom':     return await deleteCustom(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('achievement error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where(_.or([{ members: openid }, { openid }])).get();
  return res.data[0] || null;
}

async function getAllAchievements(familyId) {
  const customRes = await db.collection('customAchievements')
    .where({ familyId })
    .get();

  // Separate overrides from pure custom achievements
  const overrideMap = {};
  const customs = [];

  customRes.data.forEach(c => {
    if (c.overridesKey) {
      overrideMap[c.overridesKey] = c;
    } else if (c.enabled !== false) {
      customs.push({
        key: 'custom_' + c._id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        category: c.category,
        count: c.count,
        isCustom: true
      });
    }
  });

  // Apply overrides to built-in achievements
  const builtIn = BUILT_IN.map(b => {
    const override = overrideMap[b.key];
    if (override) {
      if (override.enabled === false) return null; // disabled
      return {
        ...b,
        name: override.name,
        description: override.description,
        icon: override.icon,
        category: override.category,
        count: override.count
      };
    }
    return b;
  }).filter(Boolean);

  return { builtIn, customs };
}

function checkAchievement(ach, stats) {
  // 自定义成就 / 被覆盖的内置成就：根据 category 和 count 检查
  if (ach.isCustom || ach.count !== undefined) {
    if (ach.category === 'all') return stats.totalTasks >= ach.count;
    return (stats.categoryTasks[ach.category] || 0) >= ach.count;
  }

  // 原始内置成就
  switch (ach.key) {
    case 'first_task':     return stats.totalTasks >= 1;
    case 'ten_tasks':      return stats.totalTasks >= 10;
    case 'fifty_tasks':    return stats.totalTasks >= 50;
    case 'hundred_tasks':  return stats.totalTasks >= 100;
    case 'sport_20':       return stats.categoryTasks.sport >= 20;
    case 'life_20':        return stats.categoryTasks.life >= 20;
    case 'study_20':       return stats.categoryTasks.study >= 20;
    case 'streak_7':       return stats.streakDays >= 7;
    case 'streak_30':      return stats.streakDays >= 30;
    case 'star_10':        return stats.topScoreCount >= 10;
    case 'lucky_epic':     return stats.hasLegendaryDraw;
    case 'level_3':        return stats.level >= 3;
    case 'level_5':        return stats.level >= 5;
    case 'points_1000':    return stats.totalPoints >= 1000;
    case 'draw_50':        return stats.totalDraws >= 50;
    default: return false;
  }
}

async function checkAndAward(familyId, event) {
  const { childId } = event;
  const child = await db.collection('children').doc(childId).get();
  if (!child.data) return { code: 404, message: '孩子不存在' };

  const stats = await collectStats(familyId, childId, child.data);
  const { builtIn, customs } = await getAllAchievements(familyId);
  const allAchievements = [...builtIn, ...customs];

  const earnedRes = await db.collection('achievements').where({ familyId, childId }).get();
  const earnedKeys = new Set(earnedRes.data.map(a => a.achievementKey));

  const newAchievements = [];

  for (const ach of allAchievements) {
    if (earnedKeys.has(ach.key)) continue;

    if (checkAchievement(ach, stats)) {
      await db.collection('achievements').add({
        data: {
          familyId,
          childId,
          achievementKey: ach.key,
          earnedAt: new Date()
        }
      });
      newAchievements.push(ach);
    }
  }

  return { code: 0, newAchievements };
}

async function getAchievements(familyId, event) {
  const { childId } = event;
  const child = await db.collection('children').doc(childId).get();
  const stats = await collectStats(familyId, childId, child.data);

  const { builtIn, customs } = await getAllAchievements(familyId);
  const allAchievements = [...builtIn, ...customs];

  const earnedRes = await db.collection('achievements').where({ familyId, childId }).get();
  const earnedMap = {};
  earnedRes.data.forEach(a => { earnedMap[a.achievementKey] = a; });

  const earned = [];
  const locked = [];

  for (const ach of allAchievements) {
    if (earnedMap[ach.key]) {
      earned.push({ ...ach, earnedAt: earnedMap[ach.key].earnedAt });
    } else {
      locked.push(ach);
    }
  }

  return { code: 0, earned, locked, total: allAchievements.length };
}

async function collectStats(familyId, childId, child) {
  const totalTasks = child.totalTasksCompleted || 0;
  const streakDays = child.streakDays || 0;
  const level = child.level || 1;
  const totalPoints = child.totalPointsEarned || 0;
  const totalDraws = child.totalDraws || 0;

  const sportRes = await db.collection('tasks').where({ familyId, childId, status: 'completed', category: _.in(['sport', 'homework']) }).count();
  const lifeRes = await db.collection('tasks').where({ familyId, childId, status: 'completed', category: _.in(['life', 'housework']) }).count();
  const studyRes = await db.collection('tasks').where({ familyId, childId, status: 'completed', category: 'study' }).count();

  const topScoreRes = await db.collection('tasks').where({ familyId, childId, status: 'completed', score: 3 }).count();

  const legendaryRes = await db.collection('drawRecords').where({ familyId, childId, prizeType: 'reward' }).get();
  const hasLegendaryDraw = legendaryRes.data.length > 0;

  return {
    totalTasks,
    streakDays,
    level,
    totalPoints,
    totalDraws,
    categoryTasks: {
      sport: sportRes.total,
      life: lifeRes.total,
      study: studyRes.total
    },
    topScoreCount: topScoreRes.total,
    hasLegendaryDraw
  };
}

// --- 自定义成就 CRUD ---

async function listCustom(familyId) {
  const res = await db.collection('customAchievements')
    .where({ familyId })
    .orderBy('createdAt', 'desc')
    .get();
  return { code: 0, achievements: res.data };
}

async function saveCustom(familyId, event) {
  const { data } = event;
  const doc = {
    familyId,
    name: data.name,
    description: data.description,
    icon: data.icon || '⭐',
    category: data.category || 'all',
    count: data.count || 10,
    enabled: data.enabled !== undefined ? data.enabled : true,
    updatedAt: new Date()
  };

  if (data.overridesKey) {
    doc.overridesKey = data.overridesKey;
  }

  if (data.id) {
    await db.collection('customAchievements').doc(data.id).update({ data: doc });
    return { code: 0, message: 'updated' };
  } else {
    doc.createdAt = new Date();
    const res = await db.collection('customAchievements').add({ data: doc });
    return { code: 0, id: res._id, message: 'created' };
  }
}

async function deleteCustom(familyId, event) {
  await db.collection('customAchievements').doc(event.id).remove();
  return { code: 0, message: 'deleted' };
}
