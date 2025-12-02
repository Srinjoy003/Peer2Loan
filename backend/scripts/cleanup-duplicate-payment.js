const { getDB, connectDB } = require("../db.js");
const { ObjectId } = require("mongodb");

async function cleanupDuplicatePayment() {
	await connectDB();
	const db = getDB();

	const cycleId = "6920871bd0f06b5decadf4b0";
	const memberId = "692731d307fb038b4cbdef0f";

	console.log("Finding duplicate payments for:", { cycleId, memberId });

	// Find all payments for this member/cycle (checking both ObjectId and string formats)
	const allPayments = await db.collection("payments").find({}).toArray();
	const payments = allPayments.filter(
		(p) =>
			(p.cycleId?.toString() === cycleId || p.cycleId === cycleId) &&
			(p.memberId?.toString() === memberId || p.memberId === memberId)
	);

	console.log(`Found ${payments.length} payment(s):`);
	payments.forEach((p, i) => {
		console.log(
			`  ${i + 1}. ID: ${p._id}, Status: ${p.status}, Updated: ${p.updatedAt}`
		);
	});

	if (payments.length <= 1) {
		console.log("No duplicates found. Exiting.");
		process.exit(0);
	}

	// Keep the one with pending_approval status, or the most recent one
	const toKeep =
		payments.find((p) => p.status === "pending_approval") ||
		payments[payments.length - 1];
	const toDelete = payments.filter(
		(p) => p._id.toString() !== toKeep._id.toString()
	);

	console.log(`\nKeeping payment: ${toKeep._id} (status: ${toKeep.status})`);
	console.log(`Deleting ${toDelete.length} duplicate(s)...`);

	for (const payment of toDelete) {
		await db.collection("payments").deleteOne({ _id: payment._id });
		console.log(
			`  ✓ Deleted payment: ${payment._id} (status: ${payment.status})`
		);
	}

	console.log("\nCleanup complete!");
	process.exit(0);
}

cleanupDuplicatePayment().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
