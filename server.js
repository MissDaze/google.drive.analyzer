const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Basic route to test the server
app.get('/', (req, res) => {
  res.send('Hello, this is your Google Drive Analyzer server!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
