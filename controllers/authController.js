import User from "../models/userModel.js";
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

import User from "../models/userModel.js";
import Spreadsheet from "../models/spreadsheetModel.js";

export const getUserData = async (req, res) => {
  const { email } = req.params;

  try {
    // Find the user by email and populate their spreadsheets with metadata only (excluding the 'data' field)
    const user = await User.findOne({ email }).populate({
      path: "spreadsheets",
      select: "name owner collaborators", // Exclude 'data' to only return metadata
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
