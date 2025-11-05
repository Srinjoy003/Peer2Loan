const { getDB } = require('../db.js');
const { ObjectId } = require('mongodb');

async function createPayment(paymentData) {
  const db = getDB();
  const result = await db.collection('payments').insertOne(paymentData);
  return result.insertedId;
}

async function getPaymentById(id) {
  const db = getDB();
  return db.collection('payments').findOne({ _id: new ObjectId(id) });
}

async function getAllPayments() {
  const db = getDB();
  return db.collection('payments').find({}).toArray();
}

async function updatePayment(id, update) {
  const db = getDB();
  await db.collection('payments').updateOne({ _id: new ObjectId(id) }, { $set: update });
  return getPaymentById(id);
}

async function deletePayment(id) {
  const db = getDB();
  await db.collection('payments').deleteOne({ _id: new ObjectId(id) });
  return true;
}

module.exports = {
  createPayment,
  getPaymentById,
  getAllPayments,
  updatePayment,
  deletePayment
};
