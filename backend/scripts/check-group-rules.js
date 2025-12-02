const { connectDB, getDB } = require("../db.js");
const { ObjectId } = require("mongodb");

async function checkGroupRules() {
	try {
		await connectDB();
		const db = getDB();

		const groupId = "6912c785dc3ed01d021ec328";

		console.log("\n=== Checking Group Late Fee Rules ===\n");

		const group = await db
			.collection("groups")
			.findOne({ _id: new ObjectId(groupId) });

		if (group) {
			console.log("Group name:", group.name);
			console.log("\nGroup rules object:");
			console.log(JSON.stringify(group.rules, null, 2));

			console.log("\n--- Late Fee Settings:");
			console.log("- perDayLateFee:", group.rules?.perDayLateFee);
			console.log("- lateFee (fixed):", group.rules?.lateFee);

			if (!group.rules?.perDayLateFee && !group.rules?.lateFee) {
				console.log("\n⚠️ WARNING: No late fee rules configured!");
				console.log("To enable penalties, you need to set either:");
				console.log("  - rules.perDayLateFee (per day penalty)");
				console.log("  - rules.lateFee (fixed penalty)");
			}
		} else {
			console.log("Group not found");
		}

		process.exit(0);
	} catch (err) {
		console.error("Error:", err);
		process.exit(1);
	}
}

checkGroupRules();
