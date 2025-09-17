const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3080;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, '../public')));

// Data file path (one level up from /server)
const DATA_FILE = path.join(__dirname, '../data.json');

// Helper functions
function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API routes
app.post('/submit', (req, res) => {
  const newEntry = req.body;
  const data = readData();
  data.push(newEntry);
  writeData(data);
  res.json({ message: 'Data saved!', newEntry });
});

app.get('/data', (req, res) => {
  res.json(readData());
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
