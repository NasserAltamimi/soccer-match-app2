const Stadium = require("../models/Stadium");
const User = require("../models/User");

const createStadium = async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user.id);

    if (!loggedInUser || loggedInUser.role !== "owner") {
      return res.status(401).json({ message: "Only owners can create stadiums" });
    }

    const stadium = await Stadium.create({
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      images: req.body.images,
      reservationSlots: req.body.reservationSlots,
      owner: loggedInUser._id,
    });

    res.status(201).json(stadium);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStadiums = async (req, res) => {
  try {
    const stadiums = await Stadium.find().populate("owner", "name email role");

    res.json(stadiums);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStadiumById = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id).populate(
      "owner",
      "name email role"
    );

    if (!stadium) {
      return res.status(404).json({ message: "Stadium not found" });
    }

    res.json(stadium);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStadium,
  getStadiums,
  getStadiumById,
};
