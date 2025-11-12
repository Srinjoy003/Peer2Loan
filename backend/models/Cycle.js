const { getDB } = require("../db.js");
const { ObjectId } = require("mongodb");

async function createCycle(cycleData) {
	const db = getDB();
	const result = await db.collection("cycles").insertOne(cycleData);
	return result.insertedId;
}

async function getCycleById(id) {
	const db = getDB();
	const cycle = await db
		.collection("cycles")
		.findOne({ _id: new ObjectId(id) });
	if (cycle) {
		cycle.id = cycle._id.toString();
	}
	return cycle;
}

async function getAllCycles() {
	const db = getDB();
	const cycles = await db.collection("cycles").find({}).toArray();
	return cycles.map((cycle) => ({
		...cycle,
		id: cycle._id.toString(),
	}));
}

async function updateCycle(id, update) {
	const db = getDB();
	await db
		.collection("cycles")
		.updateOne({ _id: new ObjectId(id) }, { $set: update });
	return getCycleById(id);
}

async function deleteCycle(id) {
	const db = getDB();
	await db.collection("cycles").deleteOne({ _id: new ObjectId(id) });
	return true;
}

module.exports = {
	createCycle,
	getCycleById,
	getAllCycles,
	updateCycle,
	deleteCycle,
};
