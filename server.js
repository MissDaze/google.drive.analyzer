const express = require('express');
const app = express();
const config = require('./config');
const port = config.port;
const routes = require('./routes');

// Use the routes defined in routes.js
app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
