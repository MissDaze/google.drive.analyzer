const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Export configuration values if needed
module.exports = {
  port: process.env.PORT || 3000,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY
  }
};
