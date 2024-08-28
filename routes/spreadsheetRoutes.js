import express from "express";
import multer from "multer";
import {
  createSpreadsheet,
  ingestData,
  changeCell,
  deleteSpreadsheet,
  manageCollaborators,
  fetchSpreadsheets, // Add this
  fetchSpreadsheet, // Add this
  removeCollaborator,
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
router.patch("/spreadsheets/:id/cell", authMiddleware, changeCell);
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

export default router;
