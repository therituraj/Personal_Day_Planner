const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Task = require("../models/Task");
const { ensureAdmin } = require("../config/auth");
const { tallySubtasks } = require("../config/countTasks");

router.use(ensureAdmin);

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function userTaskStats(userId) {
  const docs = await Task.find({ user: userId });
  return tallySubtasks(docs);
}

router.get("/", async (req, res) => {
  const [users, taskDocs] = await Promise.all([User.find(), Task.find()]);
  const totals = tallySubtasks(taskDocs);
  const admins = users.filter((u) => u.role === "admin").length;
  const activeUsers = users.filter((u) => u.isActive !== false).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogins = users.filter((u) => u.lastLogin && u.lastLogin.getTime() > weekAgo).length;
  const newest = [...users].sort((a, b) => b.date - a.date).slice(0, 6);

  const leaderboard = await Promise.all(
    users
      .filter((u) => u.role !== "admin")
      .map(async (u) => {
        const stats = await userTaskStats(u._id);
        return { user: u, stats };
      })
  );
  leaderboard.sort((a, b) => b.stats.completed - a.stats.completed);

  res.render("admin/dashboard", {
    title: "Admin overview",
    layoutClass: "page-admin",
    stats: {
      users: users.length,
      admins,
      activeUsers,
      recentLogins,
      ...totals,
    },
    newest,
    leaderboard: leaderboard.slice(0, 8),
    formatDate,
  });
});

router.get("/users", async (req, res) => {
  const q = (req.query.q || "").trim();
  const role = req.query.role || "all";
  const status = req.query.status || "all";

  const filter = {};
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
    ];
  }
  if (role !== "all") filter.role = role;
  if (status === "active") filter.isActive = true;
  if (status === "disabled") filter.isActive = false;

  const users = await User.find(filter).sort({ date: -1 });
  const rows = await Promise.all(
    users.map(async (u) => ({
      user: u,
      stats: await userTaskStats(u._id),
    }))
  );

  res.render("admin/users", {
    title: "People",
    layoutClass: "page-admin",
    rows,
    q,
    role,
    status,
    formatDate,
  });
});

router.get("/users/:id", async (req, res) => {
  const profile = await User.findById(req.params.id);
  if (!profile) {
    req.flash("error_msg", "User not found.");
    return res.redirect("/admin/users");
  }
  const docs = await Task.find({ user: profile._id }).sort({ date: -1 });
  const stats = tallySubtasks(docs);

  res.render("admin/user-detail", {
    title: profile.name,
    layoutClass: "page-admin",
    profile,
    docs,
    stats,
    formatDate,
  });
});

router.post("/users/:id/toggle", async (req, res) => {
  const profile = await User.findById(req.params.id);
  if (!profile) {
    req.flash("error_msg", "User not found.");
    return res.redirect("/admin/users");
  }
  if (profile.id === req.user.id) {
    req.flash("error_msg", "You cannot disable your own account.");
    return res.redirect(`/admin/users/${profile.id}`);
  }
  if (profile.role === "admin" && profile.isActive !== false) {
    const adminCount = await User.countDocuments({ role: "admin", isActive: true });
    if (adminCount <= 1) {
      req.flash("error_msg", "Keep at least one active admin.");
      return res.redirect(`/admin/users/${profile.id}`);
    }
  }
  profile.isActive = !profile.isActive;
  await profile.save();
  req.flash("success_msg", `${profile.name} is now ${profile.isActive ? "active" : "disabled"}.`);
  res.redirect(`/admin/users/${profile.id}`);
});

router.post("/users/:id/role", async (req, res) => {
  const profile = await User.findById(req.params.id);
  const nextRole = req.body.role === "admin" ? "admin" : "user";
  if (!profile) {
    req.flash("error_msg", "User not found.");
    return res.redirect("/admin/users");
  }
  if (profile.id === req.user.id && nextRole !== "admin") {
    req.flash("error_msg", "You cannot remove your own admin role.");
    return res.redirect(`/admin/users/${profile.id}`);
  }
  if (profile.role === "admin" && nextRole !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin", isActive: true });
    if (adminCount <= 1) {
      req.flash("error_msg", "Keep at least one admin.");
      return res.redirect(`/admin/users/${profile.id}`);
    }
  }
  profile.role = nextRole;
  await profile.save();
  req.flash("success_msg", `${profile.name} is now ${nextRole}.`);
  res.redirect(`/admin/users/${profile.id}`);
});

module.exports = router;
