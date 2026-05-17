const Message = require("../models/Message");
const Stadium = require("../models/Stadium");
const User = require("../models/User");

const getMessages = async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user.id);

    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const filter =
      loggedInUser.role === "owner"
        ? { owner: loggedInUser._id }
        : { user: loggedInUser._id };

    const messages = await Message.find(filter)
      .populate("user", "name email role")
      .populate("owner", "name email role")
      .populate("stadium", "name location")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const { stadiumId, text } = req.body;
    const cleanText = text ? text.trim() : "";

    if (!stadiumId || !cleanText) {
      return res.status(400).json({ message: "Stadium and message are required" });
    }

    const stadium = await Stadium.findById(stadiumId);

    if (!stadium) {
      return res.status(404).json({ message: "Stadium not found" });
    }

    if (stadium.owner.toString() === req.user.id) {
      return res.status(400).json({ message: "Owners cannot message themselves" });
    }

    const message = await Message.create({
      user: req.user.id,
      owner: stadium.owner,
      stadium: stadium._id,
      text: cleanText,
    });

    const savedMessage = await Message.findById(message._id)
      .populate("user", "name email role")
      .populate("owner", "name email role")
      .populate("stadium", "name location");

    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const replyToMessage = async (req, res) => {
  try {
    const { reply } = req.body;
    const cleanReply = reply ? reply.trim() : "";

    if (!cleanReply) {
      return res.status(400).json({ message: "Reply is required" });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: "Only the stadium owner can reply" });
    }

    message.reply = cleanReply;
    message.repliedAt = new Date();
    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("user", "name email role")
      .populate("owner", "name email role")
      .populate("stadium", "name location");

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMessages,
  createMessage,
  replyToMessage,
};
