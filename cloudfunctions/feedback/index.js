const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    switch (action) {
      case 'submit': {
        // 查找家庭（可选，找不到也允许提交）
        let familyId = '';
        try {
          const familyRes = await db.collection('families').where(_.or([{ members: OPENID }, { openid: OPENID }])).get();
          familyId = (familyRes.data && familyRes.data[0]) ? familyRes.data[0]._id : '';
        } catch (e) { /* 忽略 */ }
        await db.collection('feedback').add({
          data: {
            openid: OPENID,
            familyId,
            content: event.content || '',
            createdAt: new Date()
          }
        });
        return { code: 0, message: 'ok' };
      }
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('feedback error:', err);
    return { code: 500, message: err.message };
  }
};
