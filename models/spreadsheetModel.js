import mongoose from "mongoose";

const { Schema } = mongoose;

const SpreadsheetSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  data: { type: Map, of: Map }, // Nested Map structure to hold spreadsheet data (rows x columns)
  collaborators: [
    {
      email: String,
      role: { type: String, enum: ["viewer", "editor"], default: "viewer" },
    },
  ],
});

const Spreadsheet = mongoose.model("Spreadsheet", SpreadsheetSchema);

export default Spreadsheet;
