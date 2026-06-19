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
      case 'create': return await create(family._id, event);
      case 'update': return await updateChild(family._id, event);
      case 'remove': return await removeChild(family._id, event);
      case 'list':   return await list(family._id);
      case 'get':    return await get(family._id, event);
      case 'seed':   return await seedData(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('child error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where(_.or([{ members: openid }, { openid }])).get();
  return res.data[0] || null;
}

async function create(familyId, event) {
  const child = {
    familyId,
    name: event.name || '新孩子',
    avatarUrl: event.avatarUrl || '',
    age: event.age || 0,
    birthYear: event.birthYear || 0,
    totalPointsEarned: 0,
    currentPoints: 0,
    level: 1,
    streakDays: 0,
    lastActiveDate: '',
    totalTasksCompleted: 0,
    totalDraws: 0,
    createdAt: new Date()
  };
  const res = await db.collection('children').add({ data: child });
  child._id = res._id;
  return { code: 0, child };
}

async function updateChild(familyId, event) {
  const { childId, name, avatarUrl, age, birthYear } = event;
  const data = { updatedAt: new Date() };
  if (name !== undefined) data.name = name;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (age !== undefined) data.age = age;
  if (birthYear !== undefined) data.birthYear = birthYear;

  await db.collection('children').doc(childId).update({ data });
  const child = await db.collection('children').doc(childId).get();
  return { code: 0, child: child.data };
}

async function removeChild(familyId, event) {
  const { childId } = event;
  await db.collection('children').doc(childId).remove();
  return { code: 0, success: true };
}

async function list(familyId) {
  const res = await db.collection('children')
    .where({ familyId })
    .orderBy('createdAt', 'asc')
    .get();
  return { code: 0, children: res.data };
}

async function get(familyId, event) {
  const { childId } = event;
  const res = await db.collection('children').doc(childId).get();
  return { code: 0, child: res.data };
}

// 根据出生年份计算年龄
function calcAge(birthYear) {
  if (!birthYear) return 0;
  const now = new Date();
  return now.getFullYear() - birthYear;
}

// 根据年龄获取适龄任务模板
function getTaskTemplates(age) {
  if (age <= 5) {
    return [
      { title: '自己刷牙', description: '早晚各刷一次牙，保持牙齿健康', category: 'life', basePoints: 5, taskType: 'daily' },
      { title: '收拾玩具', description: '玩完玩具后自己收拾整齐', category: 'life', basePoints: 5, taskType: 'daily' },
      { title: '户外活动15分钟', description: '到户外跑跑跳跳，呼吸新鲜空气', category: 'sport', basePoints: 5, taskType: 'daily' },
      { title: '帮忙摆碗筷', description: '吃饭前帮忙摆放碗筷', category: 'life', basePoints: 8, taskType: 'daily' },
      { title: '认识5个新字', description: '在家长陪伴下学习认识5个新汉字', category: 'study', basePoints: 8, taskType: 'daily' }
    ];
  } else if (age <= 8) {
    return [
      { title: '认真完成作业', description: '独立完成今天的作业，字迹工整', category: 'study', basePoints: 10, taskType: 'daily' },
      { title: '整理书包', description: '按课表整理好明天的书包', category: 'life', basePoints: 5, taskType: 'daily' },
      { title: '跳绳100个', description: '坚持跳绳锻炼身体协调能力', category: 'sport', basePoints: 8, taskType: 'daily' },
      { title: '课外阅读20分钟', description: '选择喜欢的课外书安静阅读', category: 'study', basePoints: 10, taskType: 'daily' },
      { title: '帮忙做家务', description: '扫地、擦桌子等力所能及的家务', category: 'life', basePoints: 8, taskType: 'daily' }
    ];
  } else if (age <= 12) {
    return [
      { title: '预习明天课程', description: '提前预习明天的课程内容', category: 'study', basePoints: 10, taskType: 'daily' },
      { title: '跑步15分钟', description: '坚持跑步锻炼心肺功能', category: 'sport', basePoints: 10, taskType: 'daily' },
      { title: '整理自己房间', description: '保持房间整洁，物品归位', category: 'life', basePoints: 8, taskType: 'daily' },
      { title: '背10个英语单词', description: '每天积累英语词汇量', category: 'study', basePoints: 10, taskType: 'daily' },
      { title: '仰卧起坐30个', description: '锻炼核心力量', category: 'sport', basePoints: 8, taskType: 'daily' }
    ];
  } else {
    return [
      { title: '完成今日学习计划', description: '按照计划完成今天的学习目标', category: 'study', basePoints: 15, taskType: 'daily' },
      { title: '运动锻炼30分钟', description: '选择喜欢的运动方式坚持锻炼', category: 'sport', basePoints: 12, taskType: 'daily' },
      { title: '帮忙准备晚餐', description: '参与洗菜、切菜等备餐工作', category: 'life', basePoints: 10, taskType: 'daily' },
      { title: '深度阅读30分钟', description: '选一本好书，专注阅读并做笔记', category: 'study', basePoints: 12, taskType: 'daily' },
      { title: '整理个人空间', description: '保持书桌和卧室整洁有序', category: 'life', basePoints: 8, taskType: 'daily' }
    ];
  }
}

// 根据年龄获取适龄商品模板
function getShopTemplates(age) {
  if (age <= 5) {
    return [
      { name: '看动画片15分钟', description: '可以选择看一集喜欢的动画片', price: 30, icon: '📺', category: 'reward' },
      { name: '吃一颗糖果', description: '选一颗喜欢的糖果作为奖励', price: 10, icon: '🍬', category: 'reward' },
      { name: '玩积木20分钟', description: '自由搭建积木的快乐时光', price: 25, icon: '🧱', category: 'reward' },
      { name: '睡前多讲一个故事', description: '让爸爸妈妈多讲一个睡前故事', price: 20, icon: '📖', category: 'reward' },
      { name: '获得一张贴纸', description: '挑选一张喜欢的卡通贴纸', price: 15, icon: '⭐', category: 'reward' }
    ];
  } else if (age <= 8) {
    return [
      { name: '看动画片20分钟', description: '看一集或两集喜欢的动画片', price: 40, icon: '📺', category: 'reward' },
      { name: '吃零食一次', description: '选一样喜欢的零食', price: 25, icon: '🍪', category: 'reward' },
      { name: '玩平板15分钟', description: '在家长监督下使用平板', price: 50, icon: '📱', category: 'reward' },
      { name: '周末去公园', description: '周末全家一起去公园玩', price: 80, icon: '🌳', category: 'reward' },
      { name: '买一个小玩具', description: '挑选一件喜欢的小玩具', price: 100, icon: '🧸', category: 'reward' }
    ];
  } else if (age <= 12) {
    return [
      { name: '看视频20分钟', description: '看喜欢的短视频或科普内容', price: 50, icon: '📱', category: 'reward' },
      { name: '吃零食一次', description: '选一样喜欢的零食', price: 30, icon: '🍫', category: 'reward' },
      { name: '周末家庭出游', description: '周末全家人一起出去玩', price: 100, icon: '🎡', category: 'reward' },
      { name: '买一本喜欢的书', description: '去书店挑选一本感兴趣的书', price: 80, icon: '📚', category: 'reward' },
      { name: '游戏时间30分钟', description: '可以玩30分钟喜欢的游戏', price: 60, icon: '🎮', category: 'reward' }
    ];
  } else {
    return [
      { name: '和朋友出去玩', description: '约上好朋友一起外出活动', price: 120, icon: '🎉', category: 'reward' },
      { name: '买想要的物品', description: '挑选一件想要的物品', price: 150, icon: '🎁', category: 'reward' },
      { name: '看一部电影', description: '选一部喜欢的电影观看', price: 80, icon: '🎬', category: 'reward' },
      { name: '晚睡一小时', description: '周末可以比平时晚睡一小时', price: 50, icon: '🌙', category: 'reward' },
      { name: '游戏时间1小时', description: '可以玩1小时喜欢的游戏', price: 100, icon: '🎮', category: 'reward' }
    ];
  }
}

// 为新孩子自动生成5个任务和5个商品
async function seedData(familyId, event) {
  const { childId, birthYear } = event;
  if (!childId) return { code: 400, message: '缺少孩子ID' };

  const age = calcAge(birthYear);
  const taskTemplates = getTaskTemplates(age);
  const shopTemplates = getShopTemplates(age);

  const now = new Date();
  const tasks = [];
  const items = [];

  // 批量创建任务
  for (const tpl of taskTemplates) {
    const task = {
      familyId,
      childId,
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      basePoints: tpl.basePoints,
      taskType: tpl.taskType,
      status: 'pending',
      score: null,
      pointsAwarded: null,
      completedAt: null,
      isSelfChallenge: false,
      goal: '',
      createdAt: now
    };
    const res = await db.collection('tasks').add({ data: task });
    task._id = res._id;
    tasks.push(task);
  }

  // 批量创建商品
  for (const tpl of shopTemplates) {
    const item = {
      familyId,
      name: tpl.name,
      description: tpl.description,
      price: tpl.price,
      icon: tpl.icon,
      category: tpl.category,
      isActive: true,
      stock: -1,
      createdAt: now,
      updatedAt: now
    };
    const res = await db.collection('shop').add({ data: item });
    item._id = res._id;
    items.push(item);
  }

  console.log(`Seed data created for child ${childId} (age ${age}): ${tasks.length} tasks, ${items.length} items`);
  return { code: 0, tasks, items, age };
}
