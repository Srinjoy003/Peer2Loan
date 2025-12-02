const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "peer2loan";

async function checkCycles() {
	const client = new MongoClient(MONGO_URI);

	try {
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db(DB_NAME);
		const cyclesCollection = db.collection("cycles");

		const allCycles = await cyclesCollection.find({}).toArray();

		console.log(`\nTotal cycles: ${allCycles.length}\n`);

		allCycles.forEach((cycle) => {
			console.log(`Cycle ${cycle.cycleNumber}:`);
			console.log(`  ID: ${cycle._id}`);
			console.log(`  Status: ${cycle.status}`);
			console.log(`  Payout Executed: ${cycle.payoutExecuted}`);
			console.log(`  Pot Total: ${cycle.potTotal || "not set"}`);
			console.log(`  Winner: ${cycle.winnerId || "not set"}`);
			console.log(`  Deadline: ${cycle.deadline}`);
			console.log("");
		});
	} catch (error) {
		console.error("Error:", error);
		throw error;
	} finally {
		await client.close();
	}
}

checkCycles()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Failed:", error);
		process.exit(1);
	});
