const bcrypt = require("bcrypt");
const { connectDB } = require("../db");

async function hashExistingPasswords() {
	try {
		const db = await connectDB();
		const users = await db.collection("users").find({}).toArray();

		console.log(`Found ${users.length} users to process`);

		let hashedCount = 0;
		let skippedCount = 0;

		for (const user of users) {
			// Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
			if (user.password && !user.password.startsWith("$2")) {
				const hashedPassword = await bcrypt.hash(user.password, 10);
				await db
					.collection("users")
					.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
				console.log(`✓ Hashed password for ${user.email}`);
				hashedCount++;
			} else {
				console.log(`- Skipped ${user.email} (already hashed or no password)`);
				skippedCount++;
			}
		}

		console.log("\n=== Migration Summary ===");
		console.log(`Total users: ${users.length}`);
		console.log(`Passwords hashed: ${hashedCount}`);
		console.log(`Skipped: ${skippedCount}`);
		console.log("✅ Migration completed successfully!");

		process.exit(0);
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	}
}

hashExistingPasswords();
