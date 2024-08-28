import express from "express";
import connectDB from "./config/db.js";
import spreadsheetRoutes from "./routes/spreadsheetRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

connectDB();

app.use(express.json());

app.use("/api", spreadsheetRoutes);
app.use("/api/auth", authRoutes);
export default app;
