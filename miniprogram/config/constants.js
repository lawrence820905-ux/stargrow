module.exports = {
  // 等级阈值
  levelThresholds: [
    { level: 1, name: '小种子', points: 0, icon: '🌰' },
    { level: 2, name: '小树苗', points: 100, icon: '🌱' },
    { level: 3, name: '小树',   points: 300, icon: '🌿' },
    { level: 4, name: '大树',   points: 600, icon: '🌳' },
    { level: 5, name: '开花树', points: 1000, icon: '🌸' },
    { level: 6, name: '金色树', points: 1500, icon: '🌟' }
  ],

  // 任务分类
  categories: [
    { key: 'sport',  name: '运动', icon: '⚽', color: '#007AFF' },
    { key: 'life',   name: '生活', icon: '🏠', color: '#34C759' },
    { key: 'study',  name: '学习', icon: '📚', color: '#FF9500' }
  ],

  // 稀有度
  rarities: [
    { key: 'common',    name: '普通', color: '#8E8E93', bg: '#F2F2F7' },
    { key: 'rare',      name: '稀有', color: '#007AFF', bg: '#E8F2FF' },
    { key: 'epic',      name: '史诗', color: '#AF52DE', bg: '#F3E8FF' },
    { key: 'legendary', name: '传说', color: '#FF9500', bg: '#FFF3E0' }
  ],

  // 成就定义
  achievements: [
    { key: 'first_task',     name: '初次成长',  description: '完成第一个任务',     icon: '🎯', check: (stats) => stats.totalTasks >= 1 },
    { key: 'ten_tasks',      name: '小能手',    description: '完成10个任务',       icon: '⭐', check: (stats) => stats.totalTasks >= 10 },
    { key: 'fifty_tasks',    name: '小达人',    description: '完成50个任务',       icon: '🏅', check: (stats) => stats.totalTasks >= 50 },
    { key: 'hundred_tasks',  name: '任务大师',  description: '完成100个任务',      icon: '👑', check: (stats) => stats.totalTasks >= 100 },
    { key: 'sport_20',       name: '运动达人',  description: '完成20个运动任务',   icon: '⚽', check: (stats) => stats.categoryTasks.sport >= 20 },
    { key: 'life_20',        name: '生活能手',  description: '完成20个生活任务',   icon: '🏠', check: (stats) => stats.categoryTasks.life >= 20 },
    { key: 'study_20',       name: '学习之星',  description: '完成20个学习任务',   icon: '📚', check: (stats) => stats.categoryTasks.study >= 20 },
    { key: 'streak_7',       name: '一周坚持',  description: '连续7天完成任务',    icon: '🔥', check: (stats) => stats.streakDays >= 7 },
    { key: 'streak_30',      name: '一月坚持',  description: '连续30天完成任务',   icon: '💪', check: (stats) => stats.streakDays >= 30 },
    { key: 'star_10',        name: '棒极了',    description: '获得10次棒极了评价',  icon: '✨', check: (stats) => stats.topScoreCount >= 10 },
    { key: 'lucky_epic',     name: '欧皇附体',  description: '抽中传说级奖品',     icon: '🍀', check: (stats) => stats.hasLegendaryDraw },
    { key: 'level_3',        name: '小树成长',  description: '达到等级3',         icon: '🌿', check: (stats) => stats.level >= 3 },
    { key: 'level_5',        name: '开花结果',  description: '达到等级5',         icon: '🌸', check: (stats) => stats.level >= 5 },
    { key: 'points_1000',    name: '积分富翁',  description: '累计获得1000积分',   icon: '💰', check: (stats) => stats.totalPoints >= 1000 },
    { key: 'draw_50',        name: '抽奖达人',  description: '累计抽奖50次',       icon: '🎰', check: (stats) => stats.totalDraws >= 50 }
  ]
};
