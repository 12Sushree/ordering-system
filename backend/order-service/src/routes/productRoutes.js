const express = require("express");

const {
  syncProducts,
  getProducts,
  getProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/sync", syncProducts);
router.get("/", getProducts);
router.get("/:id", getProduct);

module.exports = router;
