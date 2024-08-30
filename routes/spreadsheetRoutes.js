import express from "express";
import multer from "multer";
import {
  createSpreadsheet,
  ingestData,
  deleteSpreadsheet,
  manageCollaborators,
  fetchSpreadsheets,
  fetchSpreadsheet,
  removeCollaborator,
  createFolder,
  fetchFolderContents,
  renameItem,
} from "../controllers/spreadsheetController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/spreadsheets", authMiddleware, createSpreadsheet);
router.post(
  "/spreadsheets/:id/ingest",
  authMiddleware,
  upload.single("file"),
  ingestData
); // Handles CSV, Parquet, JSON, and Google Sheets URL ingestion
router.delete("/spreadsheets/:id", authMiddleware, deleteSpreadsheet);
router.post(
  "/spreadsheets/:id/collaborators",
  authMiddleware,
  manageCollaborators
);
router.delete(
  "/spreadsheets/:id/collaborators",
  authMiddleware,
  removeCollaborator
);

router.get("/spreadsheets", authMiddleware, fetchSpreadsheets); // Fetch all spreadsheets
router.get("/spreadsheets/:id", authMiddleware, fetchSpreadsheet); // Fetch a specific spreadsheet by ID

// New routes for folder management
router.post("/folders", authMiddleware, createFolder); // Create a new folder
router.get("/folders/:id/contents", authMiddleware, fetchFolderContents); // Fetch contents of a specific folder
router.put("/items/:id/rename", authMiddleware, renameItem); // Rename a folder or spreadsheet

export default router;
