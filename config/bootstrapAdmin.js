const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function bootstrapAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@dayplanner.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_NAME || "Planner Admin";

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) return existingAdmin;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    existingEmail.role = "admin";
    existingEmail.isActive = true;
    await existingEmail.save();
    console.log(`Promoted existing user to admin: ${email}`);
    return existingEmail;
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    password: hashed,
    role: "admin",
    isActive: true,
  });
  console.log(`Admin account created → ${email} / ${password}`);
  return admin;
}

module.exports = bootstrapAdmin;
