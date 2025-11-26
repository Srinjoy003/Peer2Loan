const express = require("express");
const router = express.Router();
const Invitation = require("../models/Invitation.js");
const Member = require("../models/Member.js");
const Group = require("../models/Group.js");
const { getDB } = require("../db.js");
const { verifyToken, isGroupAdmin } = require("../middleware/auth.js");
const { ObjectId } = require("mongodb");

// Create invitation (when admin invites a member)
router.post("/", verifyToken, isGroupAdmin, async (req, res) => {
	try {
		const { groupId, inviteeEmail, role, memberData } = req.body;

		// Check if user with this email exists
		const db = getDB();
		const existingUser = await db
			.collection("users")
			.findOne({ email: inviteeEmail });

		if (!existingUser) {
			return res.status(404).json({
				error: "User not found",
				message: `No user account exists with email ${inviteeEmail}. They must create an account first before you can invite them.`,
			});
		}

		// Get the user's name from their account
		const inviteeName = existingUser.name;

		// Check if user is already a member of this group
		const existingMember = await db.collection("members").findOne({
			groupId,
			email: inviteeEmail,
		});

		if (existingMember) {
			return res.status(400).json({
				error: "Already a member",
				message: `${inviteeEmail} is already a member of this group.`,
			});
		}

		// Check if there's already a pending invitation
		const existingInvitation = await db.collection("invitations").findOne({
			groupId,
			inviteeEmail,
			status: "pending",
		});

		if (existingInvitation) {
			return res.status(400).json({
				error: "Invitation already sent",
				message: `There is already a pending invitation for ${inviteeEmail} to this group.`,
			});
		}

		// Store the full member data with the invitation
		const invitationData = {
			groupId,
			inviteeEmail,
			inviteeName,
			role: role || "member",
			memberData, // Store all member details
			status: "pending",
		};

		const id = await Invitation.createInvitation(invitationData);
		res.status(201).json({ id, message: "Invitation sent successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get pending invitations for logged-in user
router.get("/my-invitations", async (req, res) => {
	try {
		// Get user email from token/session (you'll need to implement auth middleware)
		const userEmail = req.user?.email || req.query.email;

		if (!userEmail) {
			return res.status(401).json({ error: "User not authenticated" });
		}

		const invitations = await Invitation.getPendingInvitationsByEmail(
			userEmail
		);

		// Populate group details for each invitation
		const invitationsWithGroups = await Promise.all(
			invitations.map(async (inv) => {
				const group = await Group.getGroupById(inv.groupId);
				return {
					...inv,
					groupName: group?.name || "Unknown Group",
					groupDetails: group,
				};
			})
		);

		res.json(invitationsWithGroups);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Accept invitation
router.post("/:id/accept", async (req, res) => {
	try {
		const invitation = await Invitation.getInvitationById(req.params.id);

		if (!invitation) {
			return res.status(404).json({ error: "Invitation not found" });
		}

		if (invitation.status !== "pending") {
			return res.status(400).json({ error: "Invitation already processed" });
		}

		// Get the actual user's name from the users collection
		const db = getDB();
		const user = await db.collection("users").findOne({ email: invitation.inviteeEmail });
		
		// Create the member from the stored memberData
		const memberData = {
			...invitation.memberData,
			name: user ? user.name : invitation.inviteeName, // Use actual user name from database, fallback to invitation name
			groupId: invitation.groupId,
			confirmedJoin: true,
			joinedAt: new Date().toISOString(),
		};

		const memberId = await Member.createMember(memberData);
		
		// If there's an active cycle, create a payment record for the new member
		const activeCycle = await db.collection("cycles").findOne({
			groupId: invitation.groupId,
			status: "active",
		});

		if (activeCycle) {
			const group = await db
				.collection("groups")
				.findOne({ _id: new ObjectId(invitation.groupId) });

			if (group) {
				try {
					await db.collection("payments").insertOne({
						cycleId: activeCycle._id,
						memberId: new ObjectId(memberId),
						groupId: invitation.groupId,
						amount: group.monthlyContribution,
						status: "pending",
						penalty: 0,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
				} catch (err) {
					// If duplicate key error (payment already exists), ignore it
					if (err.code !== 11000) {
						throw err;
					}
				}
			}
		}

		// Update invitation status
		await Invitation.updateInvitationStatus(req.params.id, "accepted");

		res.json({
			success: true,
			memberId,
			message: "Invitation accepted successfully",
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Reject invitation
router.post("/:id/reject", async (req, res) => {
	try {
		const invitation = await Invitation.getInvitationById(req.params.id);

		if (!invitation) {
			return res.status(404).json({ error: "Invitation not found" });
		}

		if (invitation.status !== "pending") {
			return res.status(400).json({ error: "Invitation already processed" });
		}

		await Invitation.updateInvitationStatus(req.params.id, "rejected");

		res.json({
			success: true,
			message: "Invitation rejected",
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all invitations (admin only)
router.get("/", async (req, res) => {
	try {
		const { email } = req.query;
		let invitations;

		if (email) {
			invitations = await Invitation.getInvitationsByEmail(email);
		} else {
			// You might want to add admin check here
			const db = require("../db.js").getDB();
			invitations = await db.collection("invitations").find({}).toArray();
		}

		res.json(invitations);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
