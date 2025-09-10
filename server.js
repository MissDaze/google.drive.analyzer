const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Google Drive API Setup
const clientId = process.env.CLIENT_ID; // Pulling from .env
const clientSecret = process.env.CLIENT_SECRET; // Pulling from .env
const redirectUri = 'http://localhost:3000/callback'; // Ensure this matches your registered redirect URI
const scopes = ['https://www.googleapis.com/auth/drive']; // Full access to Drive

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Check for saved tokens
const TOKEN_PATH = path.join(__dirname, 'tokens.json');
if (fs.existsSync(TOKEN_PATH)) {
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oauth2Client.setCredentials(tokens);
}

// Google Gemini API Setup
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-lite' });

// Routes
// Authentication route for Google Drive
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(authUrl);
});

// Callback route after Google authentication
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      res.send('Authentication successful! You can close this window and return to the app.');
    } catch (error) {
      console.error('Error retrieving access token:', error);
      res.status(500).send('Authentication failed.');
    }
  } else {
    res.status(400).send('No authorization code provided.');
  }
});

// Serve the main frontend page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// List Google Drive files (for display or API use)
app.get('/files', async (req, res) => {
  try {
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
    });
    const files = response.data.files;
    let html = '<h1>Google Drive Files</h1><ul>';
    files.forEach(file => {
      html += `<li>${file.name} (Type: ${file.mimeType}, Last Modified: ${file.modifiedTime})
        <a href="/download/${file.id}">Download</a></li>`;
    });
    html += '</ul>';
    res.send(html);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).send('Error listing files');
  }
});

// Download a specific file
app.get('/download/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const fileMeta = await drive.files.get({ fileId });
    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.data.name}"`);
    const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file');
  }
});

// API endpoint to handle user commands with Gemini AI
app.post('/api/command', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided.' });
  }
  try {
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    // Placeholder logic - later, we'll map AI response to Drive API actions
    res.json({ message: `AI Response: ${aiResponse}` });
  } catch (error) {
    console.error('Error processing command with Gemini API:', error);
    res.status(500).json({ error: 'Failed to process command.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
