const Task = require("../models/Task");

function tallySubtasks(taskDocs) {
  let completed = 0;
  let pending = 0;
  let notCompleted = 0;
  let total = 0;

  taskDocs.forEach((doc) => {
    (doc.tasks || []).forEach((subTask) => {
      total += 1;
      if (subTask.status === "COMPLETED") completed += 1;
      else if (subTask.status === "PENDING") pending += 1;
      else notCompleted += 1;
    });
  });

  return { completed, pending, notCompleted, total };
}

async function countTasks(userId) {
  const tasks = await Task.find({ user: userId });
  return tallySubtasks(tasks);
}

async function countTasksForDate(userId, date) {
  const doc = await Task.findOne({ user: userId, date });
  return tallySubtasks(doc ? [doc] : []);
}

module.exports = {
  countTasks,
  countTasksForDate,
  tallySubtasks,
};
