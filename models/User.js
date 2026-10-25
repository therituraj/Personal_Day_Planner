const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  date: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
