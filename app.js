import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import spreadsheetRoutes from "./routes/spreadsheetRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { handleSocketConnection } from "./socketController/socketController.js";
const app = express();

connectDB();

app.use(cors());

app.use(express.json());

app.use("/api", spreadsheetRoutes);
app.use("/api/auth", authRoutes);

const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  handleSocketConnection(io, socket);
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
