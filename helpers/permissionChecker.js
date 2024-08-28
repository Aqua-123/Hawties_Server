import Spreadsheet from "../models/spreadsheetModel.js";

export const checkPermissions = async (userId, spreadsheetId, requiredRole) => {
  const spreadsheet = await Spreadsheet.findById(spreadsheetId);
  if (!spreadsheet) return null;

  if (spreadsheet.owner.equals(userId)) return spreadsheet;

  const collaborator = spreadsheet.collaborators.find(
    (collab) => collab.email === userId
  );
  if (collaborator && collaborator.role === requiredRole) {
    return spreadsheet;
  }

  return null;
};
