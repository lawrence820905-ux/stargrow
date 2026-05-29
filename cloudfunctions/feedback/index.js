const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    switch (action) {
      case 'submit': {
        const family = await db.collection('families').where({ openid: OPENID }).get();
        await db.collection('feedback').add({
          data: {
            openid: OPENID,
            familyId: family.data[0] ? family.data[0]._id : '',
            content: event.content,
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
