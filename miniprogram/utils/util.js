function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) date = new Date();
  if (typeof date === 'string') date = new Date(date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

function today() {
  return formatDate(new Date(), 'YYYY-MM-DD');
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d, 'YYYY-MM-DD');
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d, 'YYYY-MM-DD');
}

function relativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diff = now - target;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(target, 'MM-DD');
}

function calcLevel(totalPoints) {
  const { levelThresholds } = require('../config/constants');
  let level = 1;
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalPoints >= levelThresholds[i].points) {
      level = levelThresholds[i].level;
      break;
    }
  }
  return level;
}

function getLevelInfo(level) {
  const { levelThresholds } = require('../config/constants');
  return levelThresholds.find(l => l.level === level) || levelThresholds[0];
}

function getNextLevelInfo(level) {
  const { levelThresholds } = require('../config/constants');
  return levelThresholds.find(l => l.level === level + 1) || null;
}

function levelProgress(totalPoints) {
  const level = calcLevel(totalPoints);
  const currentLevelInfo = getLevelInfo(level);
  const nextLevelInfo = getNextLevelInfo(level);
  if (!nextLevelInfo) return { level, percent: 100, name: currentLevelInfo.name, icon: currentLevelInfo.icon };
  const range = nextLevelInfo.points - currentLevelInfo.points;
  const progress = totalPoints - currentLevelInfo.points;
  return {
    level,
    percent: Math.min(100, Math.round((progress / range) * 100)),
    name: currentLevelInfo.name,
    icon: currentLevelInfo.icon,
    nextName: nextLevelInfo.name,
    nextIcon: nextLevelInfo.icon,
    pointsToNext: nextLevelInfo.points - totalPoints
  };
}

function calcStreak(child) {
  const lastActive = child.lastActiveDate || '';
  const todayStr = today();
  const yesterdayStr = yesterday();

  if (lastActive === todayStr) return child.streakDays || 0;
  if (lastActive === yesterdayStr) return (child.streakDays || 0);
  return 0;
}

module.exports = {
  formatDate,
  today,
  yesterday,
  daysAgo,
  relativeTime,
  calcLevel,
  getLevelInfo,
  getNextLevelInfo,
  levelProgress,
  calcStreak
};
