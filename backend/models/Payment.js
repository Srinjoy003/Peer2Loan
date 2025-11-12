const { getDB } = require("../db.js");
const { ObjectId } = require("mongodb");

async function createPayment(paymentData) {
	const db = getDB();
	const result = await db.collection("payments").insertOne(paymentData);
	return result.insertedId;
}

async function getPaymentById(id) {
	const db = getDB();
	const payment = await db
		.collection("payments")
		.findOne({ _id: new ObjectId(id) });
	if (payment) {
		payment.id = payment._id.toString();
		payment.cycleId = payment.cycleId.toString(); // Convert ObjectId to string
		payment.memberId = payment.memberId.toString(); // Convert ObjectId to string
	}
	return payment;
}

async function getAllPayments() {
	const db = getDB();
	const payments = await db.collection("payments").find({}).toArray();
	return payments.map((payment) => ({
		...payment,
		id: payment._id.toString(),
		cycleId: payment.cycleId.toString(), // Convert ObjectId to string
		memberId: payment.memberId.toString(), // Convert ObjectId to string
	}));
}

async function updatePayment(id, update, unset = null) {
	const db = getDB();
	const operations = { $set: update };
	if (unset) {
		operations.$unset = unset;
	}
	await db
		.collection("payments")
		.updateOne({ _id: new ObjectId(id) }, operations);
	return getPaymentById(id);
}

async function deletePayment(id) {
	const db = getDB();
	await db.collection("payments").deleteOne({ _id: new ObjectId(id) });
	return true;
}

module.exports = {
	createPayment,
	getPaymentById,
	getAllPayments,
	updatePayment,
	deletePayment,
};
