// import { MongoClient } from 'mongodb';

const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb://localhost:27017'; // Default local MongoDB URI
const dbName = 'peer2loan';

let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  }
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = { connectDB, getDB, closeDB };
