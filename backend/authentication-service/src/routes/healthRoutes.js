const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Authentication Service",
    status: "Running",
    timestamp: new Date(),
  });
});

module.exports = router;
