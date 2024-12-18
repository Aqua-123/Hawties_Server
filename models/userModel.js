import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  firebaseUid: String,
  photoURL: String,
  spreadsheets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Spreadsheet" }],
});

export default mongoose.model("User", UserSchema);
