const db = wx.cloud.database();

function app() { return getApp(); }

/** 确保集合存在 */
async function ensureCollection(name) {
  try {
    await db.collection(name).limit(1).get();
  } catch (e) {
    // 集合不存在，无法从客户端创建，依赖云函数初始化
    console.warn(`集合 ${name} 可能不存在:`, e.errCode || e.message);
  }
}

/** 获取当前家庭ID — 缓存优先，缺失时主动从云端拉取 */
async function getFamilyId() {
  const family = app().globalData.family;
  if (family && family._id) return family._id;

  // 缓存未命中，尝试从云端获取
  try {
    const res = await wx.cloud.callFunction({
      name: 'user',
      data: { action: 'getFamily' }
    });
    if (res.result && res.result.code === 0 && res.result.family) {
      const fam = res.result.family;
      app().setFamily(fam);
      return fam._id || '';
    }
  } catch (e) {
    console.warn('获取家庭信息失败:', e.message);
  }
  return '';
}

/** 云函数调用 */
async function callShop(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'shop',
    data: { action, ...data }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result;
}

/** 列出商品 — 双路径并发查询 */
async function listItems() {
  const familyId = await getFamilyId();

  // 并发双路径：客户端直连 + 云函数
  const clientQuery = db.collection('shop')
    .where(familyId ? { familyId, isActive: true } : { isActive: true })
    .orderBy('createdAt', 'desc')
    .get()
    .then(res => res.data || [])
    .catch(() => []);

  const cloudQuery = callShop('listItems')
    .then(r => r.items || [])
    .catch(() => []);

  const [clientItems, cloudItems] = await Promise.all([clientQuery, cloudQuery]);

  // 优先返回数量多的结果
  const items = clientItems.length >= cloudItems.length ? clientItems : cloudItems;
  console.log(`[shopService] 客户端${clientItems.length}个 云函数${cloudItems.length}个 → 返回${items.length}个`);
  return { items };
}

/** 保存商品 — 云函数优先（可自动创建集合），客户端直连降级 */
async function saveItem(data) {
  // 优先使用云函数（可以自动创建 shop 集合）
  try {
    return await callShop('saveItem', data);
  } catch (e1) {
    console.warn('云函数保存失败，尝试客户端直连:', e1.message);
    // 降级: 客户端直连数据库
    try {
      const familyId = await getFamilyId();
      if (data.id) {
        await db.collection('shop').doc(data.id).update({
          data: {
            name: data.name,
            description: data.description || '',
            price: Math.max(1, Math.floor(data.price)),
            icon: data.icon || '🎁',
            category: data.category || 'reward',
            stock: data.stock !== undefined ? data.stock : -1,
            updatedAt: db.serverDate()
          }
        });
        return { code: 0, item: data };
      } else {
        const res = await db.collection('shop').add({
          data: {
            familyId,
            name: data.name,
            description: data.description || '',
            price: Math.max(1, Math.floor(data.price)),
            icon: data.icon || '🎁',
            category: data.category || 'reward',
            isActive: true,
            stock: data.stock !== undefined ? data.stock : -1,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        });
        return { code: 0, item: { _id: res._id, ...data } };
      }
    } catch (e2) {
      throw new Error(
        '保存失败\n' +
        '云函数: ' + (e1.message || 'ok') + '\n' +
        '数据库: ' + (e2.errCode || e2.message || '未知错误')
      );
    }
  }
}

/** 删除商品 — 客户端直连优先 */
async function deleteItem(id) {
  try {
    await db.collection('shop').doc(id).update({
      data: { isActive: false, updatedAt: db.serverDate() }
    });
    return { code: 0 };
  } catch (e) {
    console.warn('客户端删除失败，尝试云函数:', e);
    return await callShop('deleteItem', { id });
  }
}

/** 兑换商品 */
async function exchange(childId, shopItemId) {
  return await callShop('exchange', { childId, shopItemId });
}

/** 获取兑换记录 */
async function getExchangeRecords(childId, page = 1, pageSize = 20) {
  return await callShop('getExchangeRecords', { childId, page, pageSize });
}

/** 兑现兑换 */
async function fulfillExchange(recordId) {
  return await callShop('fulfillExchange', { recordId });
}

module.exports = {
  listItems,
  saveItem,
  deleteItem,
  exchange,
  getExchangeRecords,
  fulfillExchange
};
