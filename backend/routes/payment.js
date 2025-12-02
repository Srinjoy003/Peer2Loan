const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment.js");
const { verifyToken, isGroupAdmin } = require("../middleware/auth.js");
const { getDB } = require("../db.js");
const { ObjectId } = require("mongodb");

// Member submits payment request (pending approval)
router.post("/request", verifyToken, async (req, res) => {
	try {
		console.log("🔔 Payment request received:", {
			cycleId: req.body.cycleId,
			memberId: req.body.memberId,
			amount: req.body.amount,
			hasSubmissionDate: !!req.body.submissionDate,
		});
		const { cycleId, memberId, amount, proof, submissionDate } = req.body;
		const db = getDB();

		// Verify member exists and belongs to the group
		const member = await db
			.collection("members")
			.findOne({ _id: new ObjectId(memberId) });
		if (!member) {
			return res.status(404).json({ error: "Member not found" });
		}

		// Verify user is the member making the request
		if (member.email !== req.user.email) {
			return res
				.status(403)
				.json({ error: "You can only submit payment requests for yourself" });
		}

		// Get cycle and group info to calculate penalty
		const cycle = await db
			.collection("cycles")
			.findOne({ _id: new ObjectId(cycleId) });
		const group = await db
			.collection("groups")
			.findOne({ _id: new ObjectId(member.groupId) });

		if (!cycle || !group) {
			return res.status(404).json({ error: "Cycle or group not found" });
		}

		// Calculate penalty if payment is late
		// Use custom submission date if provided (for testing), otherwise use current time
		// When using date input (YYYY-MM-DD), add time to make it end of day for comparison
		let now;
		if (submissionDate && submissionDate.trim() !== "") {
			// If submissionDate is just a date (YYYY-MM-DD), treat it as end of that day
			now = new Date(submissionDate);
			// Set to end of day (23:59:59) for fair comparison
			now.setHours(23, 59, 59, 999);
		} else {
			now = new Date();
		}
		const deadline = new Date(cycle.deadline);
		
		// Apply grace period - penalties start after grace period ends
		const gracePeriodDays = group.rules?.gracePeriodDays || 0;
		const graceDeadline = new Date(deadline);
		graceDeadline.setDate(graceDeadline.getDate() + gracePeriodDays);
		
		const isLate = now > graceDeadline;

		let penaltyAmount = 0;
		let daysLate = 0;

		if (isLate) {
			// Calculate days late (after grace period)
			daysLate = Math.floor((now - graceDeadline) / (1000 * 60 * 60 * 24));

			// Use per-day late fee if defined, otherwise use fixed late fee
			// Check both old and new field names for backwards compatibility
			const perDayLateFee =
				group.rules?.perDayLateFee || group.rules?.lateFeePerDay || 0;
			const fixedLateFee = group.rules?.lateFee || 0;
			const maxLateFee = group.rules?.lateFeeMax || 0;

			console.log("Group late fee rules:", {
				perDayLateFee,
				fixedLateFee,
				maxLateFee,
				gracePeriodDays,
				deadline: deadline.toISOString(),
				graceDeadline: graceDeadline.toISOString(),
				daysLate,
			});

			if (perDayLateFee > 0) {
				// Calculate based on days late
				penaltyAmount = daysLate * perDayLateFee;

				// Apply max cap if defined
				if (maxLateFee > 0 && penaltyAmount > maxLateFee) {
					penaltyAmount = maxLateFee;
				}
			} else if (fixedLateFee > 0) {
				// Use fixed late fee
				penaltyAmount = fixedLateFee;
			}

			console.log("Calculated penalty:", { penaltyAmount, daysLate });
		}

		const contributionAmount = Number(amount) - penaltyAmount;

		// Check if payment record already exists for this member/cycle
		// Search for both ObjectId and string formats to handle legacy data
		const existingPayment = await db.collection("payments").findOne({
			$or: [
				{
					cycleId: new ObjectId(cycleId),
					memberId: new ObjectId(memberId),
				},
				{
					cycleId: cycleId,
					memberId: memberId,
				},
			],
		});

		if (existingPayment) {
			// Update existing payment to pending_approval
			const updated = await Payment.updatePayment(
				existingPayment._id.toString(),
				{
					status: "pending_approval",
					proof: proof || "",
					amount: Number(amount),
					contributionAmount: contributionAmount,
					penaltyAmount: penaltyAmount,
					penalty: penaltyAmount, // Set penalty field
					daysLate: daysLate,
					submittedAt: now.toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					// Clear rejection info when resubmitting
					rejectedAt: "",
					rejectedBy: "",
					rejectionReason: "",
				}
			);

			const message =
				penaltyAmount > 0
					? `Payment request submitted with late fee of ${penaltyAmount} (${daysLate} days late). Awaiting admin approval.`
					: "Payment request submitted. Awaiting admin approval.";

			return res.status(200).json({
				id: existingPayment._id.toString(),
				message,
				penaltyAmount,
				daysLate,
			});
		}

		// If no existing payment, create new one
		const paymentData = {
			cycleId: new ObjectId(cycleId), // Store as ObjectId
			memberId: new ObjectId(memberId), // Store as ObjectId
			groupId: member.groupId,
			amount: Number(amount),
			contributionAmount: contributionAmount,
			penaltyAmount: penaltyAmount,
			penalty: penaltyAmount, // Set penalty field
			daysLate: daysLate,
			proof: proof || "",
			status: "pending_approval",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			submittedAt: now.toISOString(),
		};

		const id = await Payment.createPayment(paymentData);

		const message =
			penaltyAmount > 0
				? `Payment request submitted with late fee of ${penaltyAmount} (${daysLate} days late). Awaiting admin approval.`
				: "Payment request submitted. Awaiting admin approval.";

		res.status(201).json({
			id,
			message,
			penaltyAmount,
			daysLate,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Admin approves payment request
router.post("/:id/approve", verifyToken, isGroupAdmin, async (req, res) => {
	try {
		const db = getDB();
		const payment = await Payment.getPaymentById(req.params.id);

		if (!payment) {
			return res.status(404).json({ error: "Payment not found" });
		}

		if (payment.status !== "pending_approval") {
			return res.status(400).json({ error: "Payment is not pending approval" });
		}

		// Get member info for transaction record
		const member = await db
			.collection("members")
			.findOne({ _id: new ObjectId(payment.memberId) });

		const updated = await Payment.updatePayment(req.params.id, {
			status: "paid",
			paidOn: new Date().toISOString(),
			approvedBy: req.user.email,
			updatedAt: new Date().toISOString(),
		});

		// Create transaction ledger entry for contribution
		await db.collection("transactions").insertOne({
			groupId: payment.groupId,
			cycleId: payment.cycleId,
			paymentId: req.params.id,
			type: "contribution",
			amount: payment.contributionAmount || payment.amount,
			memberId: payment.memberId,
			memberName: member?.name || "Unknown",
			executedBy: req.user.email,
			executedAt: new Date().toISOString(),
			reference: payment.proof || "",
			metadata: {
				penaltyAmount: payment.penaltyAmount || 0,
				totalAmount: payment.amount,
			},
		});

		// If there's a penalty, create separate transaction entry
		if (payment.penaltyAmount && payment.penaltyAmount > 0) {
			await db.collection("transactions").insertOne({
				groupId: payment.groupId,
				cycleId: payment.cycleId,
				paymentId: req.params.id,
				type: "penalty",
				amount: payment.penaltyAmount,
				memberId: payment.memberId,
				memberName: member?.name || "Unknown",
				executedBy: req.user.email,
				executedAt: new Date().toISOString(),
				reference: payment.proof || "",
				metadata: {
					contributionAmount: payment.contributionAmount || payment.amount,
					totalAmount: payment.amount,
				},
			});
		}

		res.json({ success: true, payment: updated, message: "Payment approved" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Admin rejects payment request
router.post("/:id/reject", verifyToken, isGroupAdmin, async (req, res) => {
	try {
		const payment = await Payment.getPaymentById(req.params.id);

		if (!payment) {
			return res.status(404).json({ error: "Payment not found" });
		}

		if (payment.status !== "pending_approval") {
			return res.status(400).json({ error: "Payment is not pending approval" });
		}

		const { reason } = req.body;
		const updated = await Payment.updatePayment(req.params.id, {
			status: "pending", // Change back to pending so member can resubmit
			rejectedBy: req.user.email,
			rejectedAt: new Date().toISOString(),
			rejectionReason: reason || "",
			proof: "", // Clear the proof
			updatedAt: new Date().toISOString(),
		});

		res.json({ success: true, payment: updated, message: "Payment rejected" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Admin creates payment directly (original flow, admin only)
router.post("/", verifyToken, isGroupAdmin, async (req, res) => {
	try {
		const id = await Payment.createPayment(req.body);
		res.status(201).json({ id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all payments
router.get("/", async (req, res) => {
	try {
		const payments = await Payment.getAllPayments();
		res.json(payments);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get payment by ID
router.get("/:id", async (req, res) => {
	try {
		const payment = await Payment.getPaymentById(req.params.id);
		if (!payment) return res.status(404).json({ error: "Payment not found" });
		res.json(payment);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update payment
router.put("/:id", async (req, res) => {
	try {
		const updated = await Payment.updatePayment(req.params.id, req.body);
		res.json(updated);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete payment
router.delete("/:id", async (req, res) => {
	try {
		await Payment.deletePayment(req.params.id);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all transactions for a group (for ledger)
router.get("/transactions/:groupId", verifyToken, async (req, res) => {
	try {
		const db = getDB();
		const transactions = await db
			.collection("transactions")
			.find({ groupId: req.params.groupId })
			.sort({ executedAt: -1 })
			.toArray();

		res.json(transactions);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
