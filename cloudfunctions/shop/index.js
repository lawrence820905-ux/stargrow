const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 确保集合存在
async function ensureCollections() {
  const needed = ['shop', 'exchangeRecords'];
  for (const name of needed) {
    try {
      await db.collection(name).limit(1).get();
    } catch (e) {
      console.log(`集合 ${name} 检查结果:`, e.errCode, e.message);
      // 集合不存在 — 尝试创建
      if (e.errCode === -502005 || String(e.message).includes('not exist') || String(e.message).includes('502001')) {
        try {
          await db.createCollection(name);
          console.log(`集合 ${name} 创建成功`);
        } catch (e2) {
          console.warn(`集合 ${name} 创建失败:`, e2.message);
        }
      }
    }
  }
}

exports.main = async (event, context) => {
  await ensureCollections();

  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const family = await getFamilyByOpenid(OPENID);
    if (!family) return { code: 401, message: '未找到家庭' };

    switch (action) {
      case 'listItems':         return await listItems(family._id);
      case 'saveItem':          return await saveItem(family._id, event);
      case 'deleteItem':        return await deleteItem(family._id, event);
      case 'exchange':          return await doExchange(family._id, event);
      case 'getExchangeRecords':return await getExchangeRecords(family._id, event);
      case 'fulfillExchange':   return await fulfillExchange(family._id, event);
      case 'addToWishlist':      return await addToWishlist(family._id, event);
      case 'removeFromWishlist': return await removeFromWishlist(family._id, event);
      case 'getWishlist':        return await getWishlist(family._id, event);
      default: return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('shop error:', err);
    return { code: 500, message: err.message };
  }
};

async function getFamilyByOpenid(openid) {
  const res = await db.collection('families').where(_.or([{ members: openid }, { openid }])).get();
  return res.data[0] || null;
}

async function listItems(familyId) {
  const res = await db.collection('shop')
    .where({ familyId, isActive: true })
    .orderBy('createdAt', 'desc')
    .get();
  return { code: 0, items: res.data };
}

async function saveItem(familyId, event) {
  const { id, name, description, price, icon, category, isActive, stock } = event;

  const safeName = (name || '').trim();
  const safePrice = Number(price);
  if (!safeName || !safePrice || safePrice < 1) {
    return { code: 400, message: '商品名和有效价格不能为空' };
  }

  const data = {
    name: safeName,
    description: description || '',
    price: Math.max(1, Math.floor(safePrice)),
    icon: icon || '🎁',
    category: category || 'reward',
    isActive: isActive !== false,
    stock: stock !== undefined ? stock : -1,
    updatedAt: new Date()
  };

  if (id) {
    // 更新已有商品
    const existing = await db.collection('shop').doc(id).get();
    if (!existing.data) return { code: 404, message: '商品不存在' };
    await db.collection('shop').doc(id).update({ data });
    const updated = await db.collection('shop').doc(id).get();
    return { code: 0, item: updated.data };
  } else {
    // 新建商品
    data.familyId = familyId;
    data.createdAt = new Date();
    const res = await db.collection('shop').add({ data });
    data._id = res._id;
    return { code: 0, item: data };
  }
}

async function deleteItem(familyId, event) {
  const { id } = event;
  const existing = await db.collection('shop').doc(id).get();
  if (!existing.data) return { code: 404, message: '商品不存在' };

  // 软删除
  await db.collection('shop').doc(id).update({
    data: { isActive: false, updatedAt: new Date() }
  });
  return { code: 0 };
}

async function doExchange(familyId, event) {
  const { childId, shopItemId } = event;

  // 获取商品
  const itemRes = await db.collection('shop').doc(shopItemId).get();
  const item = itemRes.data;
  if (!item || !item.isActive) return { code: 404, message: '商品不存在或已下架' };
  if (item.stock === 0) return { code: 400, message: '商品已售罄' };

  // 获取孩子并检查积分
  const childRes = await db.collection('children').doc(childId).get();
  const child = childRes.data;
  if (!child) return { code: 404, message: '孩子不存在' };
  if (child.currentPoints < item.price) return { code: 400, message: '积分不足' };

  // 检查是否首次兑换
  const countRes = await db.collection('exchangeRecords')
    .where({ childId })
    .count();
  const isFirstExchange = countRes.total === 0;

  // 扣积分
  const newCurrent = child.currentPoints - item.price;
  await db.collection('children').doc(childId).update({
    data: { currentPoints: newCurrent, updatedAt: new Date() }
  });

  // 扣库存（如有限）
  if (item.stock > 0) {
    await db.collection('shop').doc(shopItemId).update({
      data: { stock: item.stock - 1, updatedAt: new Date() }
    });
  }

  // 承诺兑现期限（默认3天）
  const expectedFulfillBy = new Date();
  expectedFulfillBy.setDate(expectedFulfillBy.getDate() + 3);

  // 创建兑换记录
  const record = {
    familyId,
    childId,
    shopItemId,
    itemName: item.name,
    itemIcon: item.icon || '🎁',
    pointsSpent: item.price,
    isFulfilled: false,
    fulfilledAt: null,
    expectedFulfillBy,
    createdAt: new Date()
  };
  const recRes = await db.collection('exchangeRecords').add({ data: record });
  record._id = recRes._id;

  // 积分流水
  await db.collection('pointRecords').add({
    data: {
      familyId,
      childId,
      amount: -item.price,
      type: 'exchange_cost',
      relatedTaskId: null,
      relatedDrawId: null,
      balanceAfter: newCurrent,
      note: `兑换: ${item.name}`,
      createdAt: new Date()
    }
  });

  return { code: 0, record, newCurrent, isFirstExchange };
}

async function getExchangeRecords(familyId, event) {
  const { childId, page = 1, pageSize = 20 } = event;
  const conditions = { familyId };
  if (childId) conditions.childId = childId;

  const totalRes = await db.collection('exchangeRecords').where(conditions).count();
  const res = await db.collection('exchangeRecords')
    .where(conditions)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();

  return { code: 0, records: res.data, total: totalRes.total };
}

async function fulfillExchange(familyId, event) {
  const { recordId } = event;
  const existing = await db.collection('exchangeRecords').doc(recordId).get();
  if (!existing.data) return { code: 404, message: '记录不存在' };
  if (existing.data.isFulfilled) return { code: 400, message: '已兑现，无法重复操作' };

  await db.collection('exchangeRecords').doc(recordId).update({
    data: { isFulfilled: true, fulfilledAt: new Date() }
  });
  const record = await db.collection('exchangeRecords').doc(recordId).get();
  return { code: 0, record: record.data };
}

// 心愿单功能
async function addToWishlist(familyId, event) {
  const { childId, shopItemId } = event;
  if (!childId || !shopItemId) return { code: 400, message: '缺少参数' };

  // 检查是否已存在
  const existing = await db.collection('wishlists')
    .where({ familyId, childId, shopItemId })
    .get();
  if (existing.data.length > 0) return { code: 400, message: '已经在心愿单里了' };

  await db.collection('wishlists').add({
    data: { familyId, childId, shopItemId, createdAt: new Date() }
  });
  return { code: 0, message: '已加入心愿单' };
}

async function removeFromWishlist(familyId, event) {
  const { childId, shopItemId } = event;
  if (!childId || !shopItemId) return { code: 400, message: '缺少参数' };

  await db.collection('wishlists')
    .where({ familyId, childId, shopItemId })
    .remove();
  return { code: 0, message: '已移出心愿单' };
}

async function getWishlist(familyId, event) {
  const { childId } = event;
  if (!childId) return { code: 400, message: '缺少孩子ID' };

  const wishlistRes = await db.collection('wishlists')
    .where({ familyId, childId })
    .get();

  // 填充商品详情
  const shopItemIds = wishlistRes.data.map(w => w.shopItemId);
  if (shopItemIds.length > 0) {
    const itemsRes = await db.collection('shop')
      .where({ _id: _.in(shopItemIds), isActive: true })
      .get();
    return { code: 0, wishlist: itemsRes.data };
  }
  return { code: 0, wishlist: [] };
}
