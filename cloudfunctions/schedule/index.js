const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  try {
    // 重置日常任务：已完成 → 待完成
    const dailyTasksRes = await db.collection('tasks')
      .where(_.and([
        _.or([{ taskType: 'daily' }, { taskType: _.exists(false) }]),
        { status: 'completed' }
      ]))
      .get();

    for (const task of dailyTasksRes.data) {
      await db.collection('tasks').doc(task._id).update({
        data: { status: 'pending', score: null, pointsAwarded: null, completedAt: null }
      });
    }
    console.log(`Reset ${dailyTasksRes.data.length} daily tasks`);

    // 清除已兑奖的抽奖记录
    const fulfilledRes = await db.collection('drawRecords')
      .where({ isFulfilled: true })
      .get();
    for (const record of fulfilledRes.data) {
      await db.collection('drawRecords').doc(record._id).remove();
    }
    console.log(`Cleared ${fulfilledRes.data.length} fulfilled draw records`);

    // 清除已兑现的兑换记录
    const fulfilledExchangeRes = await db.collection('exchangeRecords')
      .where({ isFulfilled: true })
      .get();
    for (const record of fulfilledExchangeRes.data) {
      await db.collection('exchangeRecords').doc(record._id).remove();
    }
    console.log(`Cleared ${fulfilledExchangeRes.data.length} fulfilled exchange records`);

    // 重置连续天数：最后活跃日期既不是今天也不是昨天的孩子
    const childrenRes = await db.collection('children').get();

    for (const child of childrenRes.data) {
      const lastActive = child.lastActiveDate || '';
      if (lastActive === today || lastActive === yesterday) continue;

      // 断签，重置
      if (child.streakDays > 0) {
        await db.collection('children').doc(child._id).update({
          data: { streakDays: 0 }
        });
      }
    }

    return { code: 0, processed: childrenRes.data.length, today, yesterday };
  } catch (err) {
    console.error('schedule error:', err);
    return { code: 500, message: err.message };
  }
};

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
