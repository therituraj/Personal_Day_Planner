const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const Task = require("../models/Task");
const { countTasks, countTasksForDate } = require("../config/countTasks");

router.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role === "admin") return res.redirect("/admin");
    return res.redirect("/dashboard");
  }
  res.render("index", { title: "Dayline — Plan your day, your way", layoutClass: "page-home" });
});

router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  const currentDate = req.query.date || new Date().toISOString().split("T")[0];
  const tasksDoc = await Task.findOne({ user: req.user.id, date: currentDate });
  const allTime = await countTasks(req.user.id);
  const todayCounts = await countTasksForDate(req.user.id, currentDate);
  const tasks = tasksDoc ? tasksDoc.tasks : [];
  const todayDone = todayCounts.completed;
  const todayTotal = todayCounts.total;
  const progress = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;

  res.render("dashboard", {
    title: "Your day",
    layoutClass: "page-app",
    currentDate,
    tasks,
    completed: allTime.completed,
    pending: allTime.pending,
    notCompleted: allTime.notCompleted,
    total: allTime.total,
    todayCounts,
    progress,
  });
});

router.post("/dashboard/task", ensureAuthenticated, async (req, res) => {
  const { title, description, date } = req.body;
  const taskDate = date || new Date().toISOString().split("T")[0];

  if (!title || !title.trim()) {
    req.flash("error_msg", "A task needs a title.");
    return res.redirect(`/dashboard?date=${taskDate}`);
  }

  let taskDoc = await Task.findOne({ user: req.user.id, date: taskDate });
  const payload = { title: title.trim(), description: (description || "").trim() };

  if (taskDoc) {
    taskDoc.tasks.push(payload);
  } else {
    taskDoc = new Task({
      user: req.user.id,
      date: taskDate,
      tasks: [payload],
    });
  }

  await taskDoc.save();
  req.flash("success_msg", "Task added to your day.");
  res.redirect(`/dashboard?date=${taskDate}`);
});

module.exports = router;
