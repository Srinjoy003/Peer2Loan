const express = require("express");
const jwt = require("jsonwebtoken");
const { getDB } = require("../db.js");
const {
	createGroup,
	getGroupById,
	getAllGroups,
	updateGroup,
	deleteGroup,
} = require("../models/Group.js");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Middleware to extract user from token
function getUserFromToken(req) {
	const authHeader = req.headers.authorization;
	if (!authHeader) return null;
	const token = authHeader.replace("Bearer ", "");
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch {
		return null;
	}
}

// Create a new group
router.post("/", async (req, res) => {
	try {
		const groupId = await createGroup(req.body);
		res.status(201).json({ groupId });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all groups (filtered by user membership)
router.get("/", async (req, res) => {
	try {
		const user = getUserFromToken(req);

		if (!user || !user.email) {
			// No user authenticated, return empty array
			return res.json([]);
		}

		const db = getDB();
		const allGroups = await getAllGroups();

		// Find all groups where user is a member
		const memberRecords = await db
			.collection("members")
			.find({ email: user.email })
			.toArray();

		// Get group IDs where user is a member
		const memberGroupIds = memberRecords.map((m) => m.groupId);

		// Filter groups where user is admin OR is a member
		const userGroups = allGroups.filter((group) => {
			const groupId = group.id || group._id?.toString();
			const isAdmin = group.admin === user.email;
			const isMember = memberGroupIds.includes(groupId);

			return isAdmin || isMember;
		});

		// Normalize groups to have id as string
		const normalizedGroups = userGroups.map((group) => ({
			...group,
			id: group.id || group._id?.toString(),
			_id: group._id?.toString(),
		}));

		res.json(normalizedGroups);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get a group by ID
router.get("/:id", async (req, res) => {
	try {
		const group = await getGroupById(req.params.id);
		if (!group) return res.status(404).json({ error: "Group not found" });
		res.json(group);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update a group
router.put("/:id", async (req, res) => {
	try {
		const updated = await updateGroup(req.params.id, req.body);
		res.json(updated);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete a group
router.delete("/:id", async (req, res) => {
	try {
		await deleteGroup(req.params.id);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
