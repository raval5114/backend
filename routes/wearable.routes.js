const express = require("express");
const authenticate = require("../middleware/authentication.middleware");
const authorize = require("../middleware/authorization.middleware");

const router = express.Router();

router.post("/data", authenticate, authorize("WEARABLE_SYNC"), (req, res) => {
  console.log("WEARABLE DATA RECEIVED:");
  console.log(req.body);

  return res.status(200).json({
    success: true,
    message: "Wearable data received successfully",
    data: req.body,
  });
});

module.exports = router;
