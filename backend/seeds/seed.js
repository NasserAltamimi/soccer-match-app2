const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const connectDB = require("../config/db");
const Message = require("../models/Message");
const Reservation = require("../models/Reservation");
const Stadium = require("../models/Stadium");
const User = require("../models/User");

dotenv.config();

const ownerEmail = "owner@example.com";
const userEmail = "user@example.com";
const demoPassword = "123456";

function createSlots(dayOffset) {
  const today = new Date();
  const firstDate = new Date(today);
  const secondDate = new Date(today);

  firstDate.setDate(today.getDate() + dayOffset);
  secondDate.setDate(today.getDate() + dayOffset + 1);

  return [
    {
      date: firstDate,
      startTime: "18:00",
      endTime: "19:30",
      isReserved: false,
    },
    {
      date: firstDate,
      startTime: "20:00",
      endTime: "21:30",
      isReserved: false,
    },
    {
      date: secondDate,
      startTime: "19:00",
      endTime: "20:30",
      isReserved: false,
    },
  ];
}

async function seedData() {
  try {
    await connectDB();

    await Message.deleteMany({});
    await Reservation.deleteMany({});
    await Stadium.deleteMany({});
    await User.deleteMany({ email: { $in: [ownerEmail, userEmail] } });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(demoPassword, salt);

    const owner = await User.create({
      name: "Demo Owner",
      email: ownerEmail,
      password: hashedPassword,
      role: "owner",
    });

    await User.create({
      name: "Demo User",
      email: userEmail,
      password: hashedPassword,
      role: "user",
    });

    await Stadium.insertMany([
      {
        name: "KingdomArena",
        description:
          "A modern stadium with bright lighting, comfortable seating, and a premium football atmosphere.",
        location: "Riyadh - Al Nakheel",
        images: [
          "https://stadiumdb.com/pictures/stadiums/ksa/kingdom_arena/kingdom_arena12.jpg",
        ],
        owner: owner._id,
        reservationSlots: createSlots(1),
      },
      {
        name: "Al Riyadh Stadium",
        description:
          "A clean city stadium suitable for evening matches and weekend football reservations.",
        location: "Riyadh - Olaya",
        images: [
          "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
        ],
        owner: owner._id,
        reservationSlots: createSlots(2),
      },
      {
        name: "North Park Pitch",
        description:
          "A friendly neighborhood pitch with easy parking, simple facilities, and fast check-in.",
        location: "Riyadh - Al Yasmin",
        images: [
          "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
        ],
        owner: owner._id,
        reservationSlots: createSlots(3),
      },
      {
        name: "Victory Football Ground",
        description:
          "A spacious football ground with high-quality turf and clear slot availability for group bookings.",
        location: "Riyadh - Al Malqa",
        images: [
          "https://upload.wikimedia.org/wikipedia/commons/f/fe/Prince_Turki_bin_Abdulaziz_Stadium_-_1.jpg",
        ],
        owner: owner._id,
        reservationSlots: createSlots(4),
      },
      {
        name: "my Riyadh Stadium",
        description:
          "A simple stadium option for friendly matches, group practice, and evening reservations.",
        location: "Riyadh - Al Rawdah",
        images: [
          "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
        ],
        owner: owner._id,
        reservationSlots: createSlots(5),
      },
    ]);

    console.log("Seed data added successfully");
    console.log(`Demo Owner: ${ownerEmail} / ${demoPassword}`);
    console.log(`Demo User: ${userEmail} / ${demoPassword}`);
    process.exit();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

seedData();
