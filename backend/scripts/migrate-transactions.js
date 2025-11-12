const { connectDB } = require("../db.js");
const { ObjectId } = require("mongodb");

async function migrateTransactions() {
	console.log("Starting transaction migration...");

	try {
		const db = await connectDB();

		// Clear existing transactions (if you want to start fresh)
		const existingCount = await db.collection("transactions").countDocuments();
		console.log(`Found ${existingCount} existing transactions`);

		const shouldClear = process.argv.includes("--clear");
		if (shouldClear) {
			console.log("Clearing existing transactions...");
			await db.collection("transactions").deleteMany({});
			console.log("Existing transactions cleared");
		}

		// Step 1: Migrate paid payments to transaction entries
		console.log("\n--- Migrating Payments ---");
		const paidPayments = await db
			.collection("payments")
			.find({ status: "paid" })
			.toArray();

		console.log(`Found ${paidPayments.length} paid payments`);

		let contributionCount = 0;
		let penaltyCount = 0;

		for (const payment of paidPayments) {
			// Get member info
			const member = await db.collection("members").findOne({
				_id: new ObjectId(payment.memberId),
			});

			if (!member) {
				console.log(
					`Warning: Member not found for payment ${payment._id}, skipping...`
				);
				continue;
			}

			// Calculate contribution and penalty amounts
			// If we don't have these fields, use the full amount as contribution
			const contributionAmount = payment.contributionAmount || payment.amount;
			const penaltyAmount = payment.penaltyAmount || 0;

			// Create contribution transaction
			const contributionTransaction = {
				groupId: payment.groupId,
				cycleId: payment.cycleId,
				paymentId: payment._id.toString(),
				type: "contribution",
				amount: contributionAmount,
				memberId: payment.memberId,
				memberName: member.name,
				executedBy: payment.approvedBy || "system",
				executedAt: payment.paidOn || payment.updatedAt || payment.createdAt,
				reference: payment.proof || "",
				metadata: {
					penaltyAmount: penaltyAmount,
					totalAmount: payment.amount,
					migratedFrom: "historical_payment",
				},
			};

			await db.collection("transactions").insertOne(contributionTransaction);
			contributionCount++;

			// If there's a penalty, create separate penalty transaction
			if (penaltyAmount > 0) {
				const penaltyTransaction = {
					groupId: payment.groupId,
					cycleId: payment.cycleId,
					paymentId: payment._id.toString(),
					type: "penalty",
					amount: penaltyAmount,
					memberId: payment.memberId,
					memberName: member.name,
					executedBy: payment.approvedBy || "system",
					executedAt: payment.paidOn || payment.updatedAt || payment.createdAt,
					reference: payment.proof || "",
					metadata: {
						contributionAmount: contributionAmount,
						totalAmount: payment.amount,
						migratedFrom: "historical_payment",
					},
				};

				await db.collection("transactions").insertOne(penaltyTransaction);
				penaltyCount++;
			}
		}

		console.log(`✓ Created ${contributionCount} contribution transactions`);
		console.log(`✓ Created ${penaltyCount} penalty transactions`);

		// Step 2: Migrate completed payouts to transaction entries
		console.log("\n--- Migrating Payouts ---");
		const completedCycles = await db
			.collection("cycles")
			.find({ payoutExecuted: true })
			.toArray();

		console.log(
			`Found ${completedCycles.length} completed cycles with payouts`
		);

		let payoutCount = 0;

		for (const cycle of completedCycles) {
			// Get recipient info
			const recipient = await db.collection("members").findOne({
				_id: new ObjectId(cycle.payoutRecipientId),
			});

			if (!recipient) {
				console.log(
					`Warning: Recipient not found for cycle ${cycle._id}, skipping...`
				);
				continue;
			}

			// Calculate payout breakdown if not already stored
			let totalContributions = cycle.totalContributions;
			let totalPenalties = cycle.totalPenalties;
			let potTotal = cycle.potTotal;

			if (!totalContributions || !totalPenalties) {
				// Calculate from payments
				const cyclePayments = await db
					.collection("payments")
					.find({
						cycleId: cycle._id.toString(),
						status: "paid",
					})
					.toArray();

				totalContributions = cyclePayments.reduce(
					(sum, p) => sum + (p.contributionAmount || p.amount),
					0
				);
				totalPenalties = cyclePayments.reduce(
					(sum, p) => sum + (p.penaltyAmount || 0),
					0
				);
				potTotal = totalContributions + totalPenalties;

				// Update cycle with calculated values
				await db.collection("cycles").updateOne(
					{ _id: cycle._id },
					{
						$set: {
							totalContributions,
							totalPenalties,
							potTotal,
						},
					}
				);
			}

			// Create payout transaction
			const payoutTransaction = {
				groupId: cycle.groupId,
				cycleId: cycle._id.toString(),
				type: "payout",
				amount: potTotal,
				recipientId: cycle.payoutRecipientId,
				recipientName: recipient.name,
				executedBy: cycle.payoutExecutedBy || "system",
				executedAt: cycle.payoutExecutedAt || cycle.completedAt,
				reference: cycle.payoutProof || "",
				metadata: {
					cycleNumber: cycle.cycleNumber,
					month: cycle.month,
					contributions: totalContributions,
					penalties: totalPenalties,
					memberCount: cycle.paidMemberCount,
					participationRate: cycle.participationRate,
					completedOnTime: cycle.completedOnTime,
					migratedFrom: "historical_cycle",
				},
			};

			await db.collection("transactions").insertOne(payoutTransaction);
			payoutCount++;
		}

		console.log(`✓ Created ${payoutCount} payout transactions`);

		// Summary
		console.log("\n--- Migration Summary ---");
		console.log(`Total contributions: ${contributionCount}`);
		console.log(`Total penalties: ${penaltyCount}`);
		console.log(`Total payouts: ${payoutCount}`);
		console.log(
			`Total transactions created: ${
				contributionCount + penaltyCount + payoutCount
			}`
		);

		const finalCount = await db.collection("transactions").countDocuments();
		console.log(`\nTotal transactions in database: ${finalCount}`);

		console.log("\n✅ Migration completed successfully!");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	}

	process.exit(0);
}

// Run migration
migrateTransactions();
