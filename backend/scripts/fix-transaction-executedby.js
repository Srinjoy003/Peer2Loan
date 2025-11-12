const { connectDB } = require("../db.js");

async function fixTransactionExecutedBy() {
	console.log("Fixing transaction executedBy fields...");

	try {
		const db = await connectDB();

		// Get all transactions
		const transactions = await db.collection("transactions").find({}).toArray();
		console.log(`Found ${transactions.length} transactions`);

		let updatedCount = 0;

		for (const tx of transactions) {
			// Skip if executedBy doesn't look like an email
			if (!tx.executedBy || !tx.executedBy.includes("@")) {
				continue;
			}

			// Find member with this email in the transaction's group
			const member = await db.collection("members").findOne({
				email: tx.executedBy,
				groupId: tx.groupId,
			});

			if (member && member.name) {
				// Update transaction with admin name
				await db.collection("transactions").updateOne(
					{ _id: tx._id },
					{
						$set: {
							executedBy: member.name,
						},
					}
				);
				console.log(
					`Updated transaction ${tx._id}: ${tx.executedBy} -> ${member.name}`
				);
				updatedCount++;
			} else {
				console.log(
					`Warning: Could not find member for email ${tx.executedBy}`
				);
			}
		}

		console.log(`\n✓ Updated ${updatedCount} transactions`);
		process.exit(0);
	} catch (error) {
		console.error("Error fixing transactions:", error);
		process.exit(1);
	}
}

fixTransactionExecutedBy();
