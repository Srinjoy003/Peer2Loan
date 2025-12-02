const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "peer2loan";

async function fixCyclePayoutStatus() {
	const client = new MongoClient(MONGO_URI);

	try {
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db(DB_NAME);
		const cyclesCollection = db.collection("cycles");

		// Find all cycles where payoutExecuted is not explicitly set or is null/undefined
		const cyclesToFix = await cyclesCollection
			.find({
				$or: [{ payoutExecuted: { $exists: false } }, { payoutExecuted: null }],
			})
			.toArray();

		console.log(`Found ${cyclesToFix.length} cycles to fix`);

		if (cyclesToFix.length === 0) {
			console.log("No cycles need fixing");
			return;
		}

		// Update all these cycles to set payoutExecuted: false
		const result = await cyclesCollection.updateMany(
			{
				$or: [{ payoutExecuted: { $exists: false } }, { payoutExecuted: null }],
			},
			{
				$set: {
					payoutExecuted: false,
				},
			}
		);

		console.log(`Updated ${result.modifiedCount} cycles`);
		console.log("Migration completed successfully!");

		// Show sample of updated cycles
		const updatedCycles = await cyclesCollection
			.find({ payoutExecuted: false })
			.limit(5)
			.toArray();

		console.log("\nSample of updated cycles:");
		updatedCycles.forEach((cycle) => {
			console.log(
				`  - Cycle ${cycle.cycleNumber} (${cycle._id}): payoutExecuted = false`
			);
		});
	} catch (error) {
		console.error("Error during migration:", error);
		throw error;
	} finally {
		await client.close();
		console.log("\nDatabase connection closed");
	}
}

// Run the migration
fixCyclePayoutStatus()
	.then(() => {
		console.log("\n✅ Migration script finished");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n❌ Migration script failed:", error);
		process.exit(1);
	});
