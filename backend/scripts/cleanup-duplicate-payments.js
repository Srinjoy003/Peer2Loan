const { MongoClient, ObjectId } = require("mongodb");

async function cleanupDuplicatePayments() {
	const uri = "mongodb://localhost:27017";
	const dbName = "peer2loan";
	const client = new MongoClient(uri);

	try {
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db(dbName);
		const paymentsCollection = db.collection("payments");

		// Find all payments
		const allPayments = await paymentsCollection.find({}).toArray();
		console.log(`\nFound ${allPayments.length} total payments`);

		// Group by cycleId + memberId to find duplicates
		const paymentGroups = {};
		for (const payment of allPayments) {
			const key = `${payment.cycleId}_${payment.memberId}`;
			if (!paymentGroups[key]) {
				paymentGroups[key] = [];
			}
			paymentGroups[key].push(payment);
		}

		// Find groups with duplicates
		const duplicateGroups = Object.entries(paymentGroups).filter(
			([key, payments]) => payments.length > 1
		);

		console.log(`\nFound ${duplicateGroups.length} duplicate groups`);

		// For each duplicate group, keep the most recent one (by updatedAt or createdAt)
		let deletedCount = 0;
		for (const [key, payments] of duplicateGroups) {
			console.log(
				`\n--- Processing group: ${key} (${payments.length} duplicates)`
			);

			// Sort by updatedAt (most recent first)
			payments.sort((a, b) => {
				const dateA = new Date(a.updatedAt || a.createdAt);
				const dateB = new Date(b.updatedAt || b.createdAt);
				return dateB - dateA;
			});

			// Keep the first one (most recent), delete the rest
			const toKeep = payments[0];
			const toDelete = payments.slice(1);

			console.log(
				`Keeping payment: ${toKeep._id} (${toKeep.status}, ${
					toKeep.updatedAt || toKeep.createdAt
				})`
			);

			for (const payment of toDelete) {
				console.log(
					`  Deleting: ${payment._id} (${payment.status}, ${
						payment.updatedAt || payment.createdAt
					})`
				);
				await paymentsCollection.deleteOne({ _id: payment._id });
				deletedCount++;
			}
		}

		console.log(
			`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate payments.`
		);

		// Show remaining payments
		const remainingPayments = await paymentsCollection.find({}).toArray();
		console.log(`\nRemaining payments: ${remainingPayments.length}`);
		for (const payment of remainingPayments) {
			console.log(
				`  - ${payment._id}: cycleId=${payment.cycleId}, memberId=${payment.memberId}, status=${payment.status}`
			);
		}
	} catch (error) {
		console.error("Error during cleanup:", error);
	} finally {
		await client.close();
		console.log("\nDisconnected from MongoDB");
	}
}

cleanupDuplicatePayments();
