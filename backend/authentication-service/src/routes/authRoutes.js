const express = require("express");
const {
  authenticate,
  authorizeSuperAdmin,
} = require("../../../shared/middleware/authMid");
const {
  login,
  register,
  registerAdmin,
  me,
  listUsers,
  updateUserRole,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);
router.get("/me", authenticate, me);
router.post(
  "/register/admin",
  authenticate,
  authorizeSuperAdmin,
  registerAdmin,
);
router.get("/users", authenticate, authorizeSuperAdmin, listUsers);
router.patch(
  "/users/:id/role",
  authenticate,
  authorizeSuperAdmin,
  updateUserRole,
);

module.exports = router;
