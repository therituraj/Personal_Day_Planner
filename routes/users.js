const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");
const { ensureGuest } = require("../config/auth");

router.get("/register", ensureGuest, (req, res) =>
  res.render("register", { title: "Create account", layoutClass: "page-auth" })
);

router.post("/register", ensureGuest, async (req, res) => {
  const { name, email, password, password2 } = req.body;
  const errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields." });
  }
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match." });
  }
  if (password && password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters." });
  }

  if (errors.length > 0) {
    return res.render("register", {
      title: "Create account",
      layoutClass: "page-auth",
      errors,
      name,
      email,
    });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      errors.push({ msg: "Email already exists." });
      return res.render("register", {
        title: "Create account",
        layoutClass: "page-auth",
        errors,
        name,
        email,
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
    });
    req.flash("success_msg", "Welcome aboard — you can now sign in.");
    res.redirect("/users/login");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/users/register");
  }
});

router.get("/login", ensureGuest, (req, res) =>
  res.render("login", { title: "Sign in", layoutClass: "page-auth" })
);

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info && info.message ? info.message : "Login failed.");
      return res.redirect("/users/login");
    }
    req.logIn(user, async (loginErr) => {
      if (loginErr) return next(loginErr);
      user.lastLogin = new Date();
      await user.save();
      if (user.role === "admin") return res.redirect("/admin");
      return res.redirect("/dashboard");
    });
  })(req, res, next);
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success_msg", "You have signed out.");
    res.redirect("/users/login");
  });
});

module.exports = router;
