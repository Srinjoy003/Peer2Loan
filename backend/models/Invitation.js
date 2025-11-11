const { getDB } = require("../db.js");
const { ObjectId } = require("mongodb");

async function createInvitation(invitationData) {
	const db = getDB();
	const invitation = {
		...invitationData,
		status: "pending", // pending, accepted, rejected
		createdAt: new Date(),
	};
	const result = await db.collection("invitations").insertOne(invitation);
	return result.insertedId;
}

async function getInvitationById(id) {
	const db = getDB();
	return db.collection("invitations").findOne({ _id: new ObjectId(id) });
}

async function getInvitationsByEmail(email) {
	const db = getDB();
	return db.collection("invitations").find({ inviteeEmail: email }).toArray();
}

async function getPendingInvitationsByEmail(email) {
	const db = getDB();
	return db
		.collection("invitations")
		.find({
			inviteeEmail: email,
			status: "pending",
		})
		.toArray();
}

async function updateInvitationStatus(id, status) {
	const db = getDB();
	await db.collection("invitations").updateOne(
		{ _id: new ObjectId(id) },
		{
			$set: {
				status,
				respondedAt: new Date(),
			},
		}
	);
	return getInvitationById(id);
}

async function deleteInvitation(id) {
	const db = getDB();
	await db.collection("invitations").deleteOne({ _id: new ObjectId(id) });
	return true;
}

module.exports = {
	createInvitation,
	getInvitationById,
	getInvitationsByEmail,
	getPendingInvitationsByEmail,
	updateInvitationStatus,
	deleteInvitation,
};
