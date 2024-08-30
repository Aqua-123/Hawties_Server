import Spreadsheet from "../models/spreadsheetModel.js";
import {
  parseCSV,
  parseParquet,
  parseGoogleSheet,
  parseJSON,
} from "../helpers/fileParser.js";
import { checkPermissions } from "../helpers/permissionChecker.js";
const ROW_INIT_COUNT = 12500;
const COL_INIT_COUNT = 100;

export const fetchSpreadsheets = async (req, res) => {
  try {
    const spreadsheets = await Spreadsheet.find({ owner: req.user._id });
    res.status(200).send(spreadsheets);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

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
    // Initialize a 500x500 grid with empty strings
    const data = new Map();
    for (let i = 0; i < ROW_INIT_COUNT; i++) {
      const rowMap = new Map();
      for (let j = 0; j < COL_INIT_COUNT; j++) {
        rowMap.set(j.toString(), ""); // Set each cell to an empty string
      }
      data.set(i.toString(), rowMap); // Set each row map in the main data map
    }

    const spreadsheet = new Spreadsheet({
      name: req.body.name,
      owner: req.user._id,
      data: data,
      parent: req.body.parentId || null, // Reference the parent folder if provided
    });

    if (req.body.parentId) {
      const parentFolder = await Spreadsheet.findById(req.body.parentId);
      if (!parentFolder || !parentFolder.isDirectory) {
        return res.status(400).send("Invalid parent folder");
      }
      parentFolder.items.push(spreadsheet._id);
      await parentFolder.save();
    }

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

export const deleteSpreadsheet = async (req, res) => {
  try {
    const spreadsheet = await checkPermissions(
      req.user._id,
      req.params.id,
      "owner"
    );
    if (!spreadsheet) return res.status(403).send("Forbidden");

    // Recursively delete all items if it's a folder
    if (spreadsheet.isDirectory) {
      const deleteItems = async (items) => {
        for (const itemId of items) {
          const item = await Spreadsheet.findById(itemId);
          if (item.isDirectory) {
            await deleteItems(item.items);
          }
          await item.deleteOne();
        }
      };
      await deleteItems(spreadsheet.items);
    }

    await spreadsheet.deleteOne();
    res.send("Spreadsheet/folder deleted");
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

export const createFolder = async (req, res) => {
  try {
    const folder = new Spreadsheet({
      name: req.body.name,
      owner: req.user._id,
      isDirectory: true,
      parent: req.body.parentId || null,
    });

    if (req.body.parentId) {
      const parentFolder = await Spreadsheet.findById(req.body.parentId);
      if (!parentFolder || !parentFolder.isDirectory) {
        return res.status(400).send("Invalid parent folder");
      }
      parentFolder.items.push(folder._id);
      await parentFolder.save();
    }

    await folder.save();
    res.status(201).send(folder);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const fetchFolderContents = async (req, res) => {
  try {
    const folder = await Spreadsheet.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDirectory: true,
    });

    if (!folder) return res.status(404).send("Folder not found");

    const contents = await Spreadsheet.find({
      parent: req.params.id,
      owner: req.user._id,
    });
    res.status(200).send(contents);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const renameItem = async (req, res) => {
  try {
    const item = await Spreadsheet.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!item) return res.status(404).send("Item not found");

    item.name = req.body.name || item.name; // Update the name if provided
    await item.save();

    res.status(200).send({ message: "Item renamed successfully", item });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
