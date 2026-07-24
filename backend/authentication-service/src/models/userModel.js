const mongoose = require("mongoose");
const { hashPassword, verifyPassword } = require("../utils/password");
const ROLES = require("../../../shared/constants/roles");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/,
    },

    passwordHash: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true,
    },

    isSuperAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.setPassword = function setPassword(password) {
  this.passwordHash = hashPassword(password);
};
userSchema.methods.verifyPassword = function verifyUserPassword(password) {
  return verifyPassword(password, this.passwordHash);
};
userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

module.exports = mongoose.model("User", userSchema);
