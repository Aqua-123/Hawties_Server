import csvParser from "csv-parser";
import fs from "fs";
import { parse } from "parquetjs-lite"; // For Parquet files
import axios from "axios"; // For fetching data from Google Sheets

// Parse CSV
export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

// Parse Parquet
export const parseParquet = async (filePath) => {
  try {
    const reader = await parse(filePath);
    const rows = [];
    while (reader.hasNext()) {
      rows.push(await reader.next());
    }
    return rows;
  } catch (err) {
    throw new Error("Error parsing Parquet file");
  }
};

// Fetch and parse Google Sheets
export const parseGoogleSheet = async (sheetUrl) => {
  try {
    const response = await axios.get(sheetUrl);
    // Assuming data is in a JSON-compatible format (e.g., Google Sheets API response)
    return response.data;
  } catch (err) {
    throw new Error("Error fetching data from Google Sheets");
  }
};

// Parse JSON
export const parseJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject("Error parsing JSON file");
      }
    });
  });
};
