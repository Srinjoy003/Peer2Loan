// import { ObjectId } from 'mongodb';

const ObjectId = require('mongodb').ObjectId;

// User schema for MongoDB
// Fields: email, passwordHash, name, role (admin/member/auditor)
const UserSchema = {
  email: { type: 'string', required: true, unique: true },
  passwordHash: { type: 'string', required: true },
  name: { type: 'string', required: true },
  role: { type: 'string', enum: ['admin', 'member', 'auditor'], default: 'member' },
  createdAt: { type: 'date', default: () => new Date() },
};

// Example function to insert a new user (to be used in controller)
async function createUser(db, { email, passwordHash, name, role }) {
  const user = {
    email,
    passwordHash,
    name,
    role: role || 'member',
    createdAt: new Date(),
  };
  const result = await db.collection('users').insertOne(user);
  return result.insertedId;
}

// Example function to find user by email
async function findUserByEmail(db, email) {
  return db.collection('users').findOne({ email });
}

module.exports = { UserSchema, createUser, findUserByEmail };
