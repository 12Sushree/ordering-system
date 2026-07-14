const express = require("express");

const { authenticate } = require("../../../shared/middleware/authMid");
const { createOrder, getOrders } = require("../controllers/orderController");

const router = express.Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", getOrders);

module.exports = router;
