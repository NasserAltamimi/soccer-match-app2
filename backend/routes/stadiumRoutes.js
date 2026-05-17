const express = require("express");
const {
  getStadiums,
  createStadium,
  getStadiumById,
} = require("../controllers/stadiumController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getStadiums);
router.get("/:id", getStadiumById);
router.post("/", protect, createStadium);

module.exports = router;
