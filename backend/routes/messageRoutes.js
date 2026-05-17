const express = require("express");
const {
  getMessages,
  createMessage,
  replyToMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMessages);
router.post("/", protect, createMessage);
router.put("/:id/reply", protect, replyToMessage);

module.exports = router;
