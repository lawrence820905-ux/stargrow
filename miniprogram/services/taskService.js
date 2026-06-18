async function callTask(action, data = {}) {
  const res = await wx.cloud.callFunction({
    name: 'task',
    data: { action, ...data }
  });
  if (res.result.code !== 0) throw new Error(res.result.message);
  return res.result;
}

async function createTask(childId, title, description, category, basePoints, taskType = 'daily', isSelfChallenge = false, goal = '') {
  return await callTask('create', { childId, title, description, category, basePoints, taskType, isSelfChallenge, goal });
}

async function updateTask(taskId, fields) {
  return await callTask('update', { taskId, ...fields });
}

async function deleteTask(taskId) {
  return await callTask('delete', { taskId });
}

async function completeTask(taskId, score) {
  return await callTask('complete', { taskId, score });
}

async function listTasks(childId, category, status, taskType, page = 1, pageSize = 20) {
  return await callTask('list', { childId, category, status, taskType, page, pageSize });
}

async function getTodayTasks(childId) {
  return await callTask('getToday', { childId });
}

async function getTask(taskId) {
  return await callTask('get', { taskId });
}

async function proposeTask(childId, title, category, description) {
  return await callTask('propose', { childId, title, category, description });
}

async function approveProposal(taskId, basePoints, title) {
  return await callTask('approveProposal', { taskId, basePoints, title });
}

async function getProposals(childId) {
  return await callTask('getProposals', { childId });
}

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  listTasks,
  getTodayTasks,
  getTask,
  proposeTask,
  approveProposal,
  getProposals
};
