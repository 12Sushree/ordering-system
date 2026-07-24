const express = require("express");
const { createOrder, getOrders } = require("../controllers/orderController");
const { authenticate } = require("../../../shared/middleware/authMid");
const router = express.Router();

router.use(authenticate);
router.post("/", createOrder);
router.get("/", getOrders);

module.exports = router;
