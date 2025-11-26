const { MongoClient, ObjectId } = require("mongodb");

async function fixMemberNames() {
	const uri = "mongodb://localhost:27017";
	const dbName = "peer2loan";
	const client = new MongoClient(uri);

	try {
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db(dbName);
		const membersCollection = db.collection("members");
		const usersCollection = db.collection("users");

		// Get all members
		const members = await membersCollection.find({}).toArray();
		console.log(`\nFound ${members.length} members`);

		let updatedCount = 0;
		let notFoundCount = 0;

		for (const member of members) {
			// Find the corresponding user by email
			const user = await usersCollection.findOne({ email: member.email });

			if (user) {
				// Check if name needs updating
				if (member.name !== user.name) {
					console.log(
						`\nUpdating member: ${member.email}`
					);
					console.log(`  Old name: ${member.name}`);
					console.log(`  New name: ${user.name}`);

					await membersCollection.updateOne(
						{ _id: member._id },
						{ $set: { name: user.name } }
					);
					updatedCount++;
				} else {
					console.log(
						`✓ Member ${member.email} already has correct name: ${member.name}`
					);
				}
			} else {
				console.log(
					`⚠ No user found for member: ${member.email} (keeping current name: ${member.name})`
				);
				notFoundCount++;
			}
		}

		console.log(`\n✅ Update complete!`);
		console.log(`   Updated: ${updatedCount} members`);
		console.log(`   Already correct: ${members.length - updatedCount - notFoundCount} members`);
		console.log(`   No user found: ${notFoundCount} members`);
	} catch (error) {
		console.error("Error during update:", error);
	} finally {
		await client.close();
		console.log("\nDisconnected from MongoDB");
	}
}

fixMemberNames();
