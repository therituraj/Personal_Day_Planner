require("dotenv").config();
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const path = require("path");
const bootstrapAdmin = require("./config/bootstrapAdmin");

const app = express();

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

require("./config/passport")(passport);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "day-planner-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.currentPath = req.path;
  next();
});

app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));
app.use("/tasks", require("./routes/tasks"));
app.use("/admin", require("./routes/admin"));

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/personal_day_planner";

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("MongoDB Connected Successfully!");
    await bootstrapAdmin();
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.log("MongoDB Connection Error: ", err);
    process.exit(1);
  });
