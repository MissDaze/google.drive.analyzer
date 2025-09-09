const express = require('express');
const router = express.Router();
const drive = require('./googleDriveConfig');

// Home route
router.get('/', (req, res) => {
  res.send('Welcome to Google Drive Analyzer. Use this tool to manage and analyze your Drive files.');
});

// Route to list Google Drive files (placeholder for now)
router.get('/files', async (req, res) => {
  try {
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, webViewLink)'
    });
    res.json(response.data.files);
  } catch (error) {
    res.status(500).send('Error fetching files: ' + error.message);
  }
});

module.exports = router;
