const { getDB } = require("../db.js");
const { ObjectId } = require("mongodb");

async function createMember(memberData) {
	const db = getDB();
	const result = await db.collection("members").insertOne(memberData);
	return result.insertedId;
}

async function getMemberById(id) {
	const db = getDB();
	const member = await db
		.collection("members")
		.findOne({ _id: new ObjectId(id) });
	if (member) {
		member.id = member._id.toString();
	}
	return member;
}

async function getAllMembers() {
	const db = getDB();
	const members = await db.collection("members").find({}).toArray();
	return members.map((member) => ({
		...member,
		id: member._id.toString(),
	}));
}

async function updateMember(id, update) {
	const db = getDB();
	await db
		.collection("members")
		.updateOne({ _id: new ObjectId(id) }, { $set: update });
	return getMemberById(id);
}

async function deleteMember(id) {
	const db = getDB();
	await db.collection("members").deleteOne({ _id: new ObjectId(id) });
	return true;
}

module.exports = {
	createMember,
	getMemberById,
	getAllMembers,
	updateMember,
	deleteMember,
};
