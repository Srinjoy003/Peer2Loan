const express = require("express");
const router = express.Router();
const Member = require("../models/Member.js");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db.js");

// Create member
router.post("/", async (req, res) => {
	try {
		const id = await Member.createMember(req.body);
		const { groupId } = req.body;

		// Find active cycle for this group
		const db = getDB();
		const activeCycle = await db.collection("cycles").findOne({
			groupId: groupId,
			status: "active",
		});

		// If there's an active cycle, create a payment record for the new member
		if (activeCycle) {
			const group = await db
				.collection("groups")
				.findOne({ _id: new ObjectId(groupId) });

			if (group) {
				await db.collection("payments").insertOne({
					cycleId: activeCycle._id.toString(),
					memberId: id,
					groupId: groupId,
					amount: group.monthlyContribution,
					status: "pending",
					penalty: 0,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				});
			}
		}

		res.status(201).json({ id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all members
router.get("/", async (req, res) => {
	try {
		const members = await Member.getAllMembers();
		res.json(members);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get member by ID
router.get("/:id", async (req, res) => {
	try {
		const member = await Member.getMemberById(req.params.id);
		if (!member) return res.status(404).json({ error: "Member not found" });
		res.json(member);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update member
router.put("/:id", async (req, res) => {
	try {
		const updated = await Member.updateMember(req.params.id, req.body);
		res.json(updated);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete member
router.delete("/:id", async (req, res) => {
	try {
		await Member.deleteMember(req.params.id);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
