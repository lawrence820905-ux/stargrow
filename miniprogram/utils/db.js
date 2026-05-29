const db = wx.cloud.database();
const _ = db.command;

function collection(name) {
  return db.collection(name);
}

function doc(collectionName, id) {
  return collection(collectionName).doc(id);
}

function where(collectionName, conditions) {
  return collection(collectionName).where(conditions);
}

async function get(collectionName, id) {
  const res = await doc(collectionName, id).get();
  return res.data;
}

async function find(collectionName, conditions, options = {}) {
  let query = where(collectionName, conditions);
  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.order || 'desc');
  }
  if (options.skip) {
    query = query.skip(options.skip);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  const res = await query.get();
  return res.data;
}

async function add(collectionName, data) {
  const res = await collection(collectionName).add({ data });
  return res._id;
}

async function update(collectionName, id, data) {
  await doc(collectionName, id).update({ data });
}

async function remove(collectionName, id) {
  await doc(collectionName, id).remove();
}

async function count(collectionName, conditions = {}) {
  const res = await where(collectionName, conditions).count();
  return res.total;
}

module.exports = {
  db,
  _,
  collection,
  doc,
  where,
  get,
  find,
  add,
  update,
  remove,
  count
};
