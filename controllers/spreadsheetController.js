import Spreadsheet from "../models/spreadsheetModel.js";
import {
  parseCSV,
  parseParquet,
  parseGoogleSheet,
  parseJSON,
} from "../helpers/fileParser.js";
import { checkPermissions } from "../helpers/permissionChecker.js";

const ROW_INIT_COUNT = 10000;
const COL_INIT_COUNT = 100;

// Fetch all spreadsheets owned by the user
export const fetchSpreadsheets = async (req, res) => {
  try {
    const spreadsheets = await Spreadsheet.find({ owner: req.user._id }).select(
      "name owner collaborators"
    );
    res.status(200).send(spreadsheets);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Fetch a specific spreadsheet by its ID and owner
export const fetchSpreadsheet = async (req, res) => {
  try {
    const spreadsheet = await Spreadsheet.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).select("name owner collaborators data");

    if (!spreadsheet) return res.status(404).send("Spreadsheet not found");

    res.status(200).send(spreadsheet);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const createSpreadsheet = async (req, res) => {
  try {
    const data = new Map();
    for (let i = 0; i < ROW_INIT_COUNT; i++) {
      const rowMap = new Map();
      for (let j = 0; j < COL_INIT_COUNT; j++) {
        rowMap.set(j.toString(), "");
      }
      data.set(i.toString(), rowMap);
    }

    const spreadsheet = new Spreadsheet({
      name: req.body.name,
      owner: req.user._id,
      data: data,
    });

    await spreadsheet.save();
    req.user.spreadsheets.push(spreadsheet._id);
    res.status(201).send(spreadsheet);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Ingest data in bulk into a spreadsheet
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
      data = await parseGoogleSheet(req.body.sheetUrl);
    } else {
      return res.status(400).send("No file or URL provided");
    }

    if (!spreadsheet.data) {
      spreadsheet.data = new Map();
    }

    data.forEach((row, index) => {
      const rowMap = new Map(Object.entries(row));
      spreadsheet.data.set(index.toString(), rowMap);
    });

    await spreadsheet.save();

    res.status(200).send({
      message: "Data ingested successfully",
      data: Array.from(spreadsheet.data.entries()),
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

// Delete a spreadsheet
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

// Add a collaborator to a spreadsheet
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

// Remove a collaborator from a spreadsheet
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
