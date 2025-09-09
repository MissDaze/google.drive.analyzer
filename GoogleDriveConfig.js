const { google } = require('googleapis');
const config = require('./config');

// Initialize OAuth2 client for Google Drive using config
const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

// Set refresh token if available
if (config.google.refreshToken) {
  oauth2Client.setCredentials({
    refresh_token: config.google.refreshToken
  });
}

// Initialize Drive API client
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

module.exports = drive;
