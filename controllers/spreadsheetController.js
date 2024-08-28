import Spreadsheet from "../models/spreadsheetModel.js";
import {
  parseCSV,
  parseParquet,
  parseGoogleSheet,
  parseJSON,
} from "../helpers/fileParser.js";
import { checkPermissions } from "../helpers/permissionChecker.js";

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

    data.forEach((row, index) => {
      spreadsheet.data.set(index, row);
    });
    await spreadsheet.save();
    res.send("Data ingested");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Other controller functions remain unchanged...

export const changeCell = async (req, res) => {
  try {
    const { row, column, value } = req.body;
    const spreadsheet = await checkPermissions(
      req.user._id,
      req.params.id,
      "editor"
    );
    if (!spreadsheet) return res.status(403).send("Forbidden");

    spreadsheet.data.set(row, {
      ...spreadsheet.data.get(row),
      [column]: value,
    });
    await spreadsheet.save();
    res.send("Cell updated");
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
