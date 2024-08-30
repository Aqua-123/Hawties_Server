import User from "../models/userModel.js";
import { auth } from "../helpers/firebaseService.js";

const authMiddleware = async (req, res, next) => {
  console.log("authMiddleware");
  const token = req.headers.authorization?.split(" ")[1];
  const apiKey = req.headers["api-subscription-key"];
  console.log("token", token);

  if (!token && !apiKey) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    let user;

    if (token) {
      const decodedToken = await auth.verifyIdToken(token);
      user = await User.findOne({ firebaseUid: decodedToken.uid });
      console.log("decodedToken", user);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    if (!user && apiKey) {
      user = await User.findOne({ APIKey: apiKey });

      if (!user) {
        return res.status(404).json({ error: "Invalid API key" });
      }
    }

    req.user = user;
    req.user.uid = user.firebaseUid;
    req.user.userId = user._id;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({ error: "Not authorized" });
  }
};

export default authMiddleware;
