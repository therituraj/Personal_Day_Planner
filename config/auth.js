module.exports = {
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      if (req.user && req.user.isActive === false) {
        req.logout(() => {
          req.flash("error_msg", "Your account is disabled. Contact an administrator.");
          res.redirect("/users/login");
        });
        return;
      }
      return next();
    }
    req.flash("error_msg", "Please log in to continue.");
    res.redirect("/users/login");
  },
  ensureAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.role === "admin") {
      if (req.user.isActive === false) {
        req.logout(() => {
          req.flash("error_msg", "Your account is disabled.");
          res.redirect("/users/login");
        });
        return;
      }
      return next();
    }
    req.flash("error_msg", "Admin access only.");
    res.redirect("/dashboard");
  },
  ensureGuest: function (req, res, next) {
    if (req.isAuthenticated()) {
      if (req.user.role === "admin") return res.redirect("/admin");
      return res.redirect("/dashboard");
    }
    return next();
  },
};
