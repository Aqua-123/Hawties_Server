import Spreadsheet from "../models/spreadsheetModel.js";
import {
  parseCSV,
  parseParquet,
  parseGoogleSheet,
  parseJSON,
} from "../helpers/fileParser.js";
import { checkPermissions } from "../helpers/permissionChecker.js";

export const fetchSpreadsheets = async (req, res) => {
  try {
    const spreadsheets = await Spreadsheet.find({ owner: req.user._id });
    res.status(200).send(spreadsheets);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Fetch a specific spreadsheet by ID
export const fetchSpreadsheet = async (req, res) => {
  try {
    const spreadsheet = await Spreadsheet.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!spreadsheet) return res.status(404).send("Spreadsheet not found");

    res.status(200).send(spreadsheet);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Create Spreadsheet
export const createSpreadsheet = async (req, res) => {
  try {
    const spreadsheet = new Spreadsheet({
      name: req.body.name,
      owner: req.user._id,
    });
    await spreadsheet.save();
    res.status(201).send(spreadsheet);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Ingest Data in Bulk
export const ingestData = async (req, res) => {
  try {
    const spreadsheet = await checkPermissions(
      req.user._id,
      req.params.id,
      "editor"
    );

    if (!spreadsheet) return res.status(403).send("Forbidden");

    let data;
    if (req.file) {
      // File upload case
      const fileType = req.file.mimetype;
      if (fileType === "text/csv") {
        data = await parseCSV(req.file.path);
      } else if (fileType === "application/octet-stream") {
        data = await parseParquet(req.file.path);
      } else if (fileType === "application/json") {
        data = await parseJSON(req.file.path);
      } else {
        return res.status(400).send("Unsupported file type");
      }
    } else if (req.body.sheetUrl) {
      // Google Sheets case
      data = await parseGoogleSheet(req.body.sheetUrl);
    } else {
      return res.status(400).send("No file or URL provided");
    }

    if (!spreadsheet.data) {
      spreadsheet.data = new Map();
    }

    // Convert index to string to ensure string keys in Map
    data.forEach((row, index) => {
      const rowMap = new Map(Object.entries(row)); // Convert object to Map
      spreadsheet.data.set(index.toString(), rowMap);
    });

    await spreadsheet.save();

    // Send back the data to be rendered properly
    res.status(200).send({
      message: "Data ingested successfully",
      data: Array.from(spreadsheet.data.entries()), // Convert Map to array for JSON serialization
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};
// Other controller functions remain unchanged...

export const changeCell = async (req, res) => {
  try {
    const changes = req.body.changes; // Array of changes
    console.log("Received changes:", req.body.changes);

    const spreadsheet = await checkPermissions(
      req.user._id,
      req.params.id,
      "editor"
    );
    if (!spreadsheet) return res.status(403).send("Forbidden");

    changes.forEach(({ row, col, oldValue, newValue }) => {
      const rowIndex = parseInt(row, 10); // Convert row to integer index
      const colIndex = parseInt(col, 10); // Convert col to integer index

      console.log(`Updating row ${rowIndex}, column ${colIndex}`);

      let rowData = spreadsheet.data.get(String(rowIndex));
      console.log("Current row data:", rowData);

      if (!rowData) {
        console.log(`Row ${rowIndex} not found, creating new row.`);
        rowData = new Map(); // Create a new map if the row doesn't exist
      }

      const columnKeys = Array.from(rowData.keys());
      const targetColumnKey = columnKeys[colIndex];

      if (targetColumnKey === undefined) {
        console.log(`Column index ${colIndex} out of bounds`);
        return res.status(400).send("Column index out of bounds");
      }

      rowData.set(targetColumnKey, newValue); // Update the specific cell
      spreadsheet.data.set(String(rowIndex), rowData); // Reassign the updated row
    });

    // Mark the `data` field as modified to ensure Mongoose tracks the changes
    spreadsheet.markModified("data");

    await spreadsheet.save();
    res.send("Cells updated");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const deleteSpreadsheet = async (req, res) => {
  try {
    const spreadsheet = await checkPermissions(
      req.user._id,
      req.params.id,
      "owner"
    );
    if (!spreadsheet) return res.status(403).send("Forbidden");

    await spreadsheet.deleteOne();
    res.send("Spreadsheet deleted");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const manageCollaborators = async (req, res) => {
  try {
    const spreadsheet = await checkPermissions(
      req.user._id,
      req.params.id,
      "owner"
    );
    if (!spreadsheet) return res.status(403).send("Forbidden");

    const { email, role } = req.body;
    spreadsheet.collaborators.push({ email, role });
    await spreadsheet.save();
    res.send("Collaborator added");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const removeCollaborator = async (req, res) => {
  try {
    const spreadsheet = await checkPermissions(
      req.user._id,
      req.params.id,
      "owner"
    );
    if (!spreadsheet) return res.status(403).send("Forbidden");

    spreadsheet.collaborators = spreadsheet.collaborators.filter(
      (collab) => collab.email !== req.body.email
    );
    await spreadsheet.save();
    res.send("Collaborator removed");
  } catch (error) {
    res.status(400).send(error.message);
  }
};
