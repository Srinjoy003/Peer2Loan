const { getDB } = require('../db.js');
const { ObjectId } = require('mongodb');

async function createCycle(cycleData) {
  const db = getDB();
  const result = await db.collection('cycles').insertOne(cycleData);
  return result.insertedId;
}

async function getCycleById(id) {
  const db = getDB();
  return db.collection('cycles').findOne({ _id: new ObjectId(id) });
}

async function getAllCycles() {
  const db = getDB();
  return db.collection('cycles').find({}).toArray();
}

async function updateCycle(id, update) {
  const db = getDB();
  await db.collection('cycles').updateOne({ _id: new ObjectId(id) }, { $set: update });
  return getCycleById(id);
}

async function deleteCycle(id) {
  const db = getDB();
  await db.collection('cycles').deleteOne({ _id: new ObjectId(id) });
  return true;
}

module.exports = {
  createCycle,
  getCycleById,
  getAllCycles,
  updateCycle,
  deleteCycle
};