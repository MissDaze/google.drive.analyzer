const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Google OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Load saved tokens if they exist
if (fs.existsSync('tokens.json')) {
  const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
  oauth2Client.setCredentials(tokens);
  console.log('Loaded saved tokens.');
}

// Scopes for Google Drive access (read-only for now)
const scopes = ['https://www.googleapis.com/auth/drive.readonly'];

// Route to start OAuth flow
app.get('/auth', (req, res) => {
  console.log('Auth route accessed');
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(url);
});

// Callback route after user authorizes
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      // Save tokens to a file for simplicity
      fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2));
      console.log('Tokens saved:', tokens);
      res.send('Authentication successful! Tokens saved. You can close this tab.');
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      res.status(500).send('Authentication failed.');
    }
  } else {
    res.status(400).send('No authorization code provided.');
  }
});

// Basic home route
app.get('/', (req, res) => {
  res.send('Welcome to Google Drive Analyzer. Go to <a href="/auth">Authenticate</a> to connect your Drive or <a href="/files">View Files</a>.');
});

// Route to list files from Google Drive
app.get('/files', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      pageSize: 10, // Limit to 10 files for now
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
    });
    const files = response.data.files;
    if (files.length) {
      let fileList = '<h2>Your Google Drive Files:</h2><ul>';
      files.forEach(file => {
        fileList += `<li>${file.name} (Type: ${file.mimeType}, Last Modified: ${file.modifiedTime})</li>`;
      });
      fileList += '</ul>';
      res.send(fileList);
    } else {
      res.send('No files found in your Google Drive.');
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).send('Error fetching files from Google Drive. Ensure authentication is complete.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
