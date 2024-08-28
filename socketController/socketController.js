// socketController.js
import Spreadsheet from "../models/spreadsheetModel.js"; // Adjust the path as necessary

export const handleSocketConnection = (io, socket) => {
  console.log("A user connected");

  socket.on("joinSpreadsheet", (spreadsheetId) => {
    socket.join(spreadsheetId);
    console.log(`User joined spreadsheet: ${spreadsheetId}`);
  });

  socket.on("leaveSpreadsheet", (spreadsheetId) => {
    socket.leave(spreadsheetId);
    console.log(`User left spreadsheet: ${spreadsheetId}`);
  });

  socket.on("changeCell", async ({ spreadsheetId, changes }) => {
    try {
      const spreadsheet = await Spreadsheet.findById(spreadsheetId);

      if (!spreadsheet) {
        socket.emit("error", "Spreadsheet not found");
        return;
      }

      changes.forEach(({ row, col, newValue }) => {
        const rowKey = String(row);
        const colKey = String(col);

        let rowData = spreadsheet.data.get(rowKey);
        if (!rowData) {
          rowData = new Map();
        }

        const columnKeys = Array.from(rowData.keys());
        const targetColumnKey = columnKeys[colKey];

        if (targetColumnKey === undefined) {
          socket.emit("error", "Column index out of bounds");
          return;
        }

        rowData.set(targetColumnKey, newValue);
        spreadsheet.data.set(rowKey, rowData);
      });

      spreadsheet.markModified("data");
      await spreadsheet.save();

      // Broadcast the change to all users in the same spreadsheet room
      io.to(spreadsheetId).emit("cellChanged", { changes });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
};
