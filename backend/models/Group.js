const { getDB } = require('../db.js');
const { ObjectId } = require('mongodb');

// groupData should include: members (array), admin (string or object)
async function createGroup(groupData) {
  const db = getDB();
  // Ensure members and admin fields exist
  if (!Array.isArray(groupData.members)) groupData.members = [];
  if (!groupData.admin) groupData.admin = null;
  const result = await db.collection('groups').insertOne(groupData);
  return result.insertedId;
}

async function getGroupById(id) {
  const db = getDB();
  return db.collection('groups').findOne({ _id: new ObjectId(id) });
}

async function getAllGroups() {
  const db = getDB();
  return db.collection('groups').find({}).toArray();
}

async function updateGroup(id, update) {
  const db = getDB();
  await db.collection('groups').updateOne({ _id: new ObjectId(id) }, { $set: update });
  return getGroupById(id);
}

async function deleteGroup(id) {
  const db = getDB();
  await db.collection('groups').deleteOne({ _id: new ObjectId(id) });
  return true;
}

module.exports = {
  createGroup,
  getGroupById,
  getAllGroups,
  updateGroup,
  deleteGroup
};