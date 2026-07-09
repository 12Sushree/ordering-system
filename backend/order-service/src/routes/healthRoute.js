const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Order Service",
    status: "Running",
    timestamp: new Date(),
  });
});

module.exports = router;
