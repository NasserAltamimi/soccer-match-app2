const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const registerUser = async (req, res) => {
  try {
    const name = req.body.name ? req.body.name.trim() : "";
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const password = req.body.password || "";
    const role = req.body.role === "owner" ? "owner" : "user";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: createToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter your email and password" });
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: createToken(user._id),
      });
    }

    res.status(400).json({ message: "Invalid email or password" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = (req, res) => {
  res.json(req.user);
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUserById,
};
