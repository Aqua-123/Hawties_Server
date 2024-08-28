import csvParser from "csv-parser";
import fs from "fs";
import pkg from "parquetjs-lite";
import axios from "axios";

const { ParquetReader } = pkg;

// Parse CSV
export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(`Error parsing CSV file: ${err.message}`));
  });
};

// Parse Parquet
export const parseParquet = async (filePath) => {
  try {
    const reader = await ParquetReader.openFile(filePath);
    const cursor = reader.getCursor();
    const rows = [];

    let record = null;
    while ((record = await cursor.next())) {
      rows.push(record);
    }

    await reader.close();
    return rows;
  } catch (err) {
    throw new Error(`Error parsing Parquet file: ${err.message}`);
  }
};

// Fetch and parse Google Sheets
export const parseGoogleSheet = async (sheetUrl) => {
  try {
    const response = await axios.get(sheetUrl);
    return response.data;
  } catch (err) {
    throw new Error(`Error fetching data from Google Sheets: ${err.message}`);
  }
};

// Parse JSON
export const parseJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return reject(`Error reading JSON file: ${err.message}`);
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject(`Error parsing JSON file: ${parseError.message}`);
      }
    });
  });
};
