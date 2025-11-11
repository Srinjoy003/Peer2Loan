const jwt = require("jsonwebtoken");
const { getDB } = require("../db.js");
const { ObjectId } = require("mongodb");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Middleware to verify JWT token
function verifyToken(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "No token provided" });
	}

	const token = authHeader.substring(7);
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded; // Attach user info to request
		next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid token" });
	}
}

// Middleware to check if user is admin of a specific group
async function isGroupAdmin(req, res, next) {
	try {
		const { groupId } = req.body;
		const userEmail = req.user.email;

		if (!groupId) {
			return res.status(400).json({ error: "Group ID required" });
		}

		const db = getDB();
		const group = await db.collection("groups").findOne({
			$or: [{ _id: new ObjectId(groupId) }, { id: groupId }],
		});

		if (!group) {
			return res.status(404).json({ error: "Group not found" });
		}

		if (group.admin !== userEmail) {
			return res.status(403).json({
				error: "Permission denied",
				message: "Only group admins can perform this action",
			});
		}

		next();
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
}

module.exports = { verifyToken, isGroupAdmin };
