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
  isDirectory: { type: Boolean, default: false }, // New field to indicate if this is a folder or a file
  parent: { type: Schema.Types.ObjectId, ref: "Spreadsheet" }, // New field to reference the parent folder
  items: [{ type: Schema.Types.ObjectId, ref: "Spreadsheet" }], // New field to store references to children (subfolders and files)
});

const Spreadsheet = mongoose.model("Spreadsheet", SpreadsheetSchema);

export default Spreadsheet;
