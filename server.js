const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const recordingsDir = path.join(__dirname, 'public', 'recordings');

// Increase the body parser limit
app.use(bodyParser.json({ limit: '50mb' })); // Allow up to 50MB
app.use(express.static('public'));

// Save JSON pose data
app.post('/save', (req, res) => {
  const filename = `pose_${Date.now()}.json`;
  const filePath = path.join(recordingsDir, filename);
  fs.writeFile(filePath, JSON.stringify(req.body), (err) => {
    if (err) return res.status(500).send('Failed to save file.');
    res.send('Saved: ' + filename);
  });
});

// Get random pose file
app.get('/random-pose', (req, res) => {
  fs.readdir(recordingsDir, (err, files) => {
    if (err || files.length === 0) return res.status(404).send('No files found.');
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const randomFile = jsonFiles[Math.floor(Math.random() * jsonFiles.length)];
    res.sendFile(path.join(recordingsDir, randomFile));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});