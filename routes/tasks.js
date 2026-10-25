const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { ensureAuthenticated } = require("../config/auth");

function redirectDate(req) {
  return req.body.date || req.query.date || new Date().toISOString().split("T")[0];
}

router.post("/edit/:taskId", ensureAuthenticated, async (req, res) => {
  const date = redirectDate(req);
  const { title, description } = req.body;
  try {
    if (!title || !title.trim()) {
      req.flash("error_msg", "A task needs a title.");
      return res.redirect(`/dashboard?date=${date}`);
    }
    await Task.updateOne(
      { user: req.user.id, "tasks._id": req.params.taskId },
      {
        $set: {
          "tasks.$.title": title.trim(),
          "tasks.$.description": (description || "").trim(),
        },
      }
    );
    req.flash("success_msg", "Task updated.");
    res.redirect(`/dashboard?date=${date}`);
  } catch (error) {
    console.error("Error updating task:", error);
    req.flash("error_msg", "Could not update that task.");
    res.redirect(`/dashboard?date=${date}`);
  }
});

router.post("/delete/:taskId", ensureAuthenticated, async (req, res) => {
  const date = redirectDate(req);
  try {
    await Task.updateOne(
      { user: req.user.id, "tasks._id": req.params.taskId },
      { $pull: { tasks: { _id: req.params.taskId } } }
    );
    req.flash("success_msg", "Task removed.");
    res.redirect(`/dashboard?date=${date}`);
  } catch (error) {
    console.error("Error deleting task:", error);
    req.flash("error_msg", "Could not delete that task.");
    res.redirect(`/dashboard?date=${date}`);
  }
});

async function setStatus(req, res, status) {
  try {
    const result = await Task.updateOne(
      { user: req.user.id, "tasks._id": req.params.taskId },
      { $set: { "tasks.$.status": status } }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json({ message: `Task marked ${status.toLowerCase().replace("_", " ")}` });
  } catch (error) {
    res.status(500).json({ error: "Error updating task status" });
  }
}

router.patch("/:taskId/status/pending", ensureAuthenticated, (req, res) =>
  setStatus(req, res, "PENDING")
);
router.patch("/:taskId/status/notcompleted", ensureAuthenticated, (req, res) =>
  setStatus(req, res, "NOT_COMPLETED")
);
router.patch("/:taskId/status/completed", ensureAuthenticated, (req, res) =>
  setStatus(req, res, "COMPLETED")
);

module.exports = router;
