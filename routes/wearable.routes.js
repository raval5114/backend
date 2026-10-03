const express = require("express");

const router = express.Router();

router.post("/data", (req, res) => {
  console.log("WEARABLE DATA RECEIVED:");
  console.log(req.body);

  return res.status(200).json({
    success: true,
    message: "Wearable data received successfully",
    data: req.body,
  });
});

module.exports = router;