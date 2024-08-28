import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: String,
  spreadsheets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Spreadsheet" }],
});

export default mongoose.model("User", UserSchema);
