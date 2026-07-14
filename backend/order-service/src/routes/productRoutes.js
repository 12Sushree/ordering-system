const express = require("express");

const { authenticate, authorizeRoles } = require("../../../shared/middleware/authMid");
const ROLES = require("../../../shared/constants/roles");

const {
  syncProducts,
  getProducts,
  getPublicProducts,
  getProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/public", authenticate, getPublicProducts);
router.get("/sync", authenticate, authorizeRoles(ROLES.ADMIN), syncProducts);
router.get("/", authenticate, authorizeRoles(ROLES.ADMIN), getProducts);
router.get("/:id", authenticate, authorizeRoles(ROLES.ADMIN), getProduct);

module.exports = router;
