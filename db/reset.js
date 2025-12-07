const mongoose = require('mongoose');
const { run } = require('./db');

async function reset() {
    await run();
    await mongoose.connection.db.dropDatabase();
    console.log("Database cleared");
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
}

reset();