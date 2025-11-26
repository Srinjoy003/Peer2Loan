const { MongoClient } = require("mongodb");

async function addUniqueIndex() {
	const uri = "mongodb://localhost:27017";
	const dbName = "peer2loan";
	const client = new MongoClient(uri);

	try {
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db(dbName);
		const paymentsCollection = db.collection("payments");

		// Create a unique compound index on cycleId + memberId
		await paymentsCollection.createIndex(
			{ cycleId: 1, memberId: 1 },
			{ unique: true, name: "unique_cycle_member" }
		);

		console.log("✅ Successfully created unique index on cycleId + memberId");

		// List all indexes
		const indexes = await paymentsCollection.indexes();
		console.log("\nCurrent indexes:");
		indexes.forEach((index) => {
			console.log(`  - ${index.name}:`, index.key);
		});
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await client.close();
		console.log("\nDisconnected from MongoDB");
	}
}

addUniqueIndex();
