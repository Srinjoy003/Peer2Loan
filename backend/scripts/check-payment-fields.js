const { connectDB, getDB } = require("../db.js");

async function checkPaymentFields() {
	try {
		await connectDB();
		const db = getDB();

		console.log("\n=== Checking Payment Fields ===\n");

		// Get one payment to see its structure
		const payment = await db.collection("payments").findOne({});

		if (payment) {
			console.log("Sample payment record:");
			console.log(JSON.stringify(payment, null, 2));

			console.log("\n--- Payment has these fields:");
			console.log("- amount:", payment.amount);
			console.log("- penaltyAmount:", payment.penaltyAmount);
			console.log("- penalty:", payment.penalty);
			console.log("- daysLate:", payment.daysLate);
			console.log("- contributionAmount:", payment.contributionAmount);
			console.log("- status:", payment.status);
		} else {
			console.log("No payments found in database");
		}

		// Count payments with penalties
		const paymentsWithPenalty = await db.collection("payments").countDocuments({
			$or: [{ penaltyAmount: { $gt: 0 } }, { penalty: { $gt: 0 } }],
		});

		console.log("\n--- Stats:");
		console.log(
			"Total payments:",
			await db.collection("payments").countDocuments({})
		);
		console.log("Payments with penalty > 0:", paymentsWithPenalty);

		process.exit(0);
	} catch (err) {
		console.error("Error:", err);
		process.exit(1);
	}
}

checkPaymentFields();
