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

  socket.on("addRow", async ({ spreadsheetId, rowIndex }) => {
    try {
      const spreadsheet = await Spreadsheet.findById(spreadsheetId);

      if (!spreadsheet) {
        socket.emit("error", "Spreadsheet not found");
        return;
      }

      const newRowKey = String(rowIndex);
      const newRowData = new Map();

      // Shift rows after the inserted row downwards
      const newData = new Map();
      spreadsheet.data.forEach((rowData, key) => {
        const numericKey = parseInt(key, 10);
        if (numericKey >= rowIndex) {
          newData.set(String(numericKey + 1), rowData);
        } else {
          newData.set(key, rowData);
        }
      });

      newData.set(newRowKey, newRowData);

      spreadsheet.data = newData;

      spreadsheet.markModified("data");
      await spreadsheet.save();

      io.to(spreadsheetId).emit("rowAdded", { rowIndex });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("removeRow", async ({ spreadsheetId, rowIndex }) => {
    try {
      const spreadsheet = await Spreadsheet.findById(spreadsheetId);

      if (!spreadsheet) {
        socket.emit("error", "Spreadsheet not found");
        return;
      }

      const rowKey = String(rowIndex);
      spreadsheet.data.delete(rowKey);

      // Shift rows after the removed row upwards
      const newData = new Map();
      spreadsheet.data.forEach((rowData, key) => {
        const numericKey = parseInt(key, 10);
        if (numericKey > rowIndex) {
          newData.set(String(numericKey - 1), rowData);
        } else {
          newData.set(key, rowData);
        }
      });

      spreadsheet.data = newData;

      spreadsheet.markModified("data");
      await spreadsheet.save();

      io.to(spreadsheetId).emit("rowRemoved", { rowIndex });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("addColumn", async ({ spreadsheetId, colIndex }) => {
    try {
      const spreadsheet = await Spreadsheet.findById(spreadsheetId);

      if (!spreadsheet) {
        socket.emit("error", "Spreadsheet not found");
        return;
      }

      spreadsheet.data.forEach((rowData, rowKey) => {
        const newRowData = new Map();

        // Shift columns after the inserted column rightwards
        Array.from(rowData.keys()).forEach((key, index) => {
          if (index >= colIndex) {
            newRowData.set(String(index + 1), rowData.get(key));
          } else {
            newRowData.set(key, rowData.get(key));
          }
        });

        newRowData.set(String(colIndex), ""); // Add the new column
        spreadsheet.data.set(rowKey, newRowData);
      });

      spreadsheet.markModified("data");
      await spreadsheet.save();

      io.to(spreadsheetId).emit("columnAdded", { colIndex });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("removeColumn", async ({ spreadsheetId, colIndex }) => {
    try {
      const spreadsheet = await Spreadsheet.findById(spreadsheetId);

      if (!spreadsheet) {
        socket.emit("error", "Spreadsheet not found");
        return;
      }

      spreadsheet.data.forEach((rowData, rowKey) => {
        const newRowData = new Map();

        // Shift columns after the removed column leftwards
        Array.from(rowData.keys()).forEach((key, index) => {
          if (index < colIndex) {
            newRowData.set(key, rowData.get(key));
          } else if (index > colIndex) {
            newRowData.set(String(index - 1), rowData.get(key));
          }
        });

        spreadsheet.data.set(rowKey, newRowData);
      });

      spreadsheet.markModified("data");
      await spreadsheet.save();

      io.to(spreadsheetId).emit("columnRemoved", { colIndex });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
};
