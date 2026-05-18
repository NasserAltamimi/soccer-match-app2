const express = require("express");
const {
  getStadiums,
  createStadium,
  getMyStadiums,
  getStadiumById,
  deleteStadium,
} = require("../controllers/stadiumController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getStadiums);
router.get("/owner/mine", protect, getMyStadiums);
router.get("/:id", getStadiumById);
router.post("/", protect, createStadium);
router.delete("/:id", protect, deleteStadium);

module.exports = router;
