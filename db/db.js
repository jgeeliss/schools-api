const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read database credentials
const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { user, password, host, clusterName } = config.databaseCredentials;

// MongoDB connection URI
const uri = `mongodb+srv://${user}:${password}@${host}/?appName=${clusterName}`;

async function run() {
  try {
    // Connect to MongoDB using Mongoose!
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

module.exports = { run };
