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
  getAuditLogs,
  getNotifications,
  markNotificationRead,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/register/admin", authenticate, authorizeSuperAdmin, registerAdmin);
router.get("/me", authenticate, me);
router.get("/users", authenticate, authorizeSuperAdmin, listUsers);
router.patch("/users/:id/role", authenticate, authorizeSuperAdmin, updateUserRole);
router.get("/audit-logs", authenticate, authorizeSuperAdmin, getAuditLogs);
router.get("/notifications", authenticate, getNotifications);
router.post("/notifications/:id/read", authenticate, markNotificationRead);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);

module.exports = router;
