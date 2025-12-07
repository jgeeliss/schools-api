// source: code taken from the MongoDB Atlas Node.js Quick Start
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read database credentials
const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { user, password, host, clusterName } = config.databaseCredentials;

// MongoDB connection URI
const uri = `mongodb+srv://${user}:${password}@${host}/?appName=${clusterName}`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

module.exports = { run, client };
