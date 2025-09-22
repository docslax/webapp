const fs = require("fs");
const path = require("path");

function readData(filePath) {
  const absPath = path.join(__dirname, "..", filePath);
  if (!fs.existsSync(absPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(absPath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeData(filePath, data) {
  const absPath = path.join(__dirname, "..", filePath);
  fs.writeFileSync(absPath, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData };
