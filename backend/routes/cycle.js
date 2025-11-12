const express = require("express");
const router = express.Router();
const Cycle = require("../models/Cycle.js");
const { ObjectId } = require("mongodb");
const { verifyToken, isGroupAdmin } = require("../middleware/auth.js");
const { getDB } = require("../db.js");

// Create cycle (admin only)
router.post("/", verifyToken, isGroupAdmin, async (req, res) => {
	try {
		const { groupId, targetPayoutMemberId, cycleNumber } = req.body;
		const db = getDB();

		// Fetch group to compute expected month and validate schedule
		const group = await db
			.collection("groups")
			.findOne({ _id: new ObjectId(groupId) });
		if (!group) {
			return res.status(404).json({ error: "Group not found" });
		}

		// Check if cycle number already exists for this group
		const existingCycle = await db.collection("cycles").findOne({
			groupId: groupId,
			cycleNumber: cycleNumber,
		});

		if (existingCycle) {
			return res.status(400).json({
				error: "Duplicate cycle number",
				message: `Cycle #${cycleNumber} already exists for this group.`,
			});
		}

		// Get the highest cycle number for this group
		const allGroupCycles = await db
			.collection("cycles")
			.find({ groupId: groupId })
			.sort({ cycleNumber: -1 })
			.limit(1)
			.toArray();

		const lastCycleNumber =
			allGroupCycles.length > 0 ? allGroupCycles[0].cycleNumber : 0;

		// Validate that new cycle number is incremental (last + 1)
		if (cycleNumber !== lastCycleNumber + 1) {
			const expectedNumber = lastCycleNumber + 1;
			const currentCycleMessage =
				lastCycleNumber === 0
					? "No cycles exist yet"
					: `Current highest cycle is ${lastCycleNumber}`;

			return res.status(400).json({
				error: "Invalid cycle number",
				message: `Cycle number must be ${expectedNumber} (next in sequence). ${currentCycleMessage}.`,
			});
		}
		// Validate that targetPayoutMemberId (email) exists as a member in this group and map to recipient id when possible
		let payoutRecipientId = req.body.payoutRecipientId;
		if (targetPayoutMemberId) {
			const member = await db.collection("members").findOne({
				groupId: groupId,
				email: targetPayoutMemberId,
			});

			if (!member) {
				return res.status(404).json({
					error: "Member not found",
					message: `No member with email ${targetPayoutMemberId} exists in this group.`,
				});
			}
			payoutRecipientId = member._id
				? member._id.toString()
				: payoutRecipientId;
		}

		// Compute expected month from group's startMonth and interval
		function addMonths(date, months) {
			const d = new Date(date);
			const day = d.getUTCDate();
			d.setUTCMonth(d.getUTCMonth() + months);
			// Handle month overflow (e.g., Jan 31 + 1 month)
			if (d.getUTCDate() !== day) {
				d.setUTCDate(0);
			}
			return d;
		}

		const interval = group.cycleIntervalMonths || 1;
		const start = group.startMonth ? new Date(group.startMonth) : new Date();
		const expectedDate = addMonths(start, interval * (Number(cycleNumber) - 1));

		const cycleData = Object.assign({}, req.body, {
			month: expectedDate.toISOString(),
			payoutRecipientId,
		});

		const id = await Cycle.createCycle(cycleData);

		// Automatically create payment records for all members in the group
		const members = await db
			.collection("members")
			.find({ groupId: groupId })
			.toArray();

		if (members.length > 0) {
			const paymentRecords = members.map((member) => ({
				cycleId: id, // Store as ObjectId
				memberId: member._id, // Store as ObjectId (not string)
				groupId: groupId,
				amount: group.monthlyContribution,
				status: "pending",
				penalty: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}));

			await db.collection("payments").insertMany(paymentRecords);
		}
		res.status(201).json({ id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all cycles
router.get("/", async (req, res) => {
	try {
		const cycles = await Cycle.getAllCycles();
		res.json(cycles);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get cycle by ID
router.get("/:id", async (req, res) => {
	try {
		const cycle = await Cycle.getCycleById(req.params.id);
		if (!cycle) return res.status(404).json({ error: "Cycle not found" });
		res.json(cycle);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update cycle
router.put("/:id", async (req, res) => {
	try {
		const updated = await Cycle.updateCycle(req.params.id, req.body);
		res.json(updated);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete cycle
router.delete("/:id", async (req, res) => {
	try {
		await Cycle.deleteCycle(req.params.id);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Create payment records for a cycle (in case they're missing)
router.post("/:id/create-payments", verifyToken, async (req, res) => {
	try {
		const cycleId = req.params.id;
		console.log("Creating payments for cycle ID:", cycleId);
		const db = getDB();

		// Get the cycle
		const cycle = await db
			.collection("cycles")
			.findOne({ _id: new ObjectId(cycleId) });
		if (!cycle) {
			console.log("Cycle not found:", cycleId);
			return res.status(404).json({ error: "Cycle not found" });
		}
		console.log("Found cycle:", cycle);

		// Get the group
		const group = await db
			.collection("groups")
			.findOne({ _id: new ObjectId(cycle.groupId) });
		if (!group) {
			return res.status(404).json({ error: "Group not found" });
		}

		// Check if user is admin of this group
		const userEmail = req.user.email;
		if (group.admin !== userEmail) {
			return res.status(403).json({
				error: "Permission denied",
				message: "Only group admins can perform this action",
			});
		}

		// Get all members
		const members = await db
			.collection("members")
			.find({ groupId: cycle.groupId })
			.toArray();

		// Check which members already have payment records
		const existingPayments = await db
			.collection("payments")
			.find({ cycleId: cycleId })
			.toArray();

		const existingMemberIds = new Set(existingPayments.map((p) => p.memberId));

		// Create payment records for members who don't have them
		const newPaymentRecords = members
			.filter((member) => !existingMemberIds.has(member._id.toString()))
			.map((member) => ({
				cycleId: cycleId,
				memberId: member._id.toString(),
				groupId: cycle.groupId,
				amount: group.monthlyContribution,
				status: "pending",
				penalty: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}));

		if (newPaymentRecords.length > 0) {
			await db.collection("payments").insertMany(newPaymentRecords);
			res.json({
				message: `Created ${newPaymentRecords.length} payment records`,
				created: newPaymentRecords.length,
			});
		} else {
			res.json({
				message: "All members already have payment records",
				created: 0,
			});
		}
	} catch (err) {
		console.error("Error creating payment records:", err);
		res.status(500).json({ error: err.message, details: err.stack });
	}
});

// Execute payout (admin only)
router.post(
	"/:id/execute-payout",
	verifyToken,
	isGroupAdmin,
	async (req, res) => {
		try {
			const cycleId = req.params.id;
			const { proof } = req.body; // Optional proof of payout (receipt, transaction ID, etc.)
			const db = getDB();

			// Get cycle
			const cycle = await db.collection("cycles").findOne({
				_id: new ObjectId(cycleId),
			});

			if (!cycle) {
				return res.status(404).json({ error: "Cycle not found" });
			}

			// Check if payout already executed
			if (cycle.payoutExecuted) {
				return res.status(400).json({
					error: "Payout has already been executed for this cycle",
				});
			}

			// Get all payments for this cycle
			const payments = await db
				.collection("payments")
				.find({
					cycleId: new ObjectId(cycleId),
				})
				.toArray();

			// Check if all required members have paid (quorum check)
			const group = await db.collection("groups").findOne({
				_id: new ObjectId(cycle.groupId),
			});

			const requiredPayments = Math.ceil(
				payments.length * ((group.rules?.quorumPercentage || 100) / 100)
			);

			const paidPayments = payments.filter((p) => p.status === "paid");

			if (paidPayments.length < requiredPayments) {
				return res.status(400).json({
					error: "Cannot execute payout. Quorum not met.",
					paidCount: paidPayments.length,
					requiredCount: requiredPayments,
				});
			}

			// Calculate total pot breakdown
			const totalContributions = paidPayments.reduce(
				(sum, p) => sum + (p.contributionAmount || p.amount),
				0
			);
			const totalPenalties = paidPayments.reduce(
				(sum, p) => sum + (p.penaltyAmount || 0),
				0
			);
			const potTotal = totalContributions + totalPenalties;

			// Calculate participation metrics
			const participationRate = (paidPayments.length / payments.length) * 100;
			const completedOnTime = new Date() <= new Date(cycle.deadline);

			// Update cycle - mark payout as executed
			await db.collection("cycles").updateOne(
				{ _id: new ObjectId(cycleId) },
				{
					$set: {
						payoutExecuted: true,
						potTotal: potTotal,
						totalContributions: totalContributions,
						totalPenalties: totalPenalties,
						participationRate: participationRate,
						paidMemberCount: paidPayments.length,
						totalMemberCount: payments.length,
						completedOnTime: completedOnTime,
						payoutExecutedAt: new Date().toISOString(),
						payoutExecutedBy: req.user.email,
						payoutProof: proof || "",
						status: "completed",
						completedAt: new Date().toISOString(),
					},
				}
			);

			// Create transaction ledger entry for audit trail
			await db.collection("transactions").insertOne({
				groupId: cycle.groupId,
				cycleId: cycleId,
				type: "payout",
				amount: potTotal,
				recipientId: cycle.payoutRecipientId,
				executedBy: req.user.email,
				executedAt: new Date().toISOString(),
				reference: proof || "",
				metadata: {
					cycleNumber: cycle.cycleNumber,
					month: cycle.month,
					contributions: totalContributions,
					penalties: totalPenalties,
					memberCount: paidPayments.length,
					participationRate: participationRate,
					completedOnTime: completedOnTime,
				},
			});

			res.json({
				message: "Payout executed successfully",
				potTotal,
				totalContributions,
				totalPenalties,
				participationRate,
				completedOnTime,
				recipient: cycle.payoutRecipientId,
				executedAt: new Date().toISOString(),
			});
		} catch (err) {
			console.error("Error executing payout:", err);
			res.status(500).json({ error: err.message });
		}
	}
);

module.exports = router;
