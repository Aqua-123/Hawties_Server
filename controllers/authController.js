import User from "../models/userModel.js";
import Spreadsheet from "../models/spreadsheetModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const signUp = async (req, res) => {
  const { name, email, uid, photoURL } = req.body;

  if (!email || !uid) {
    return res.status(400).json({ error: "Missing email or UID" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({ name, email, firebaseUid: uid, photoURL });

    await user.save();

    const payload = { id: user.id };
    const token = jwt.sign(payload, "blablabla", {
      expiresIn: "1h",
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const signIn = async (req, res) => {
  const { email, password } = req.body.payload;

  try {
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password); // Added 'await' here
    console.log(isMatch);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, "blablabla", {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const getUserData = async (req, res) => {
  const { email } = req.user;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Fetch spreadsheets owned by the user
    const ownedSpreadsheets = await Spreadsheet.find({
      owner: user._id,
    }).select("name owner collaborators");

    // Fetch spreadsheets where the user is a collaborator (but not the owner)
    const sharedSpreadsheets = await Spreadsheet.find({
      collaborators: { $elemMatch: { email: user.email } },
      owner: { $ne: user._id },
    }).select("name owner collaborators");

    // Return both lists in the response
    res.json({
      user: {
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
      ownedSpreadsheets,
      sharedSpreadsheets,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
