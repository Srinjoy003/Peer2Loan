const express = require("express");
const router = express.Router();
const Cycle = require("../models/Cycle.js");
const { verifyToken, isGroupAdmin } = require("../middleware/auth.js");
const { getDB } = require("../db.js");

// Create cycle (admin only)
router.post("/", verifyToken, isGroupAdmin, async (req, res) => {
	try {
		const { groupId, targetPayoutMemberId, cycleNumber } = req.body;
		const db = getDB();

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
		const currentCycleMessage = lastCycleNumber === 0 
			? "No cycles exist yet" 
			: `Current highest cycle is ${lastCycleNumber}`;
		
		return res.status(400).json({
			error: "Invalid cycle number",
			message: `Cycle number must be ${expectedNumber} (next in sequence). ${currentCycleMessage}.`,
		});
	}		// Validate that targetPayoutMemberId (email) exists as a member in this group
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
		}

		const id = await Cycle.createCycle(req.body);
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

module.exports = router;
