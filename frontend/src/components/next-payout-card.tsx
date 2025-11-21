import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Member, Cycle, Group } from "../types";
import { ArrowRight, Users } from "lucide-react";

interface NextPayoutCardProps {
	cycles: Cycle[];
	members: Member[];
	group: Group;
}

export function NextPayoutCard({
	cycles,
	members,
	group,
}: NextPayoutCardProps) {
	const getNextPayoutRecipient = () => {
		const contributingMembers = members.filter((m) => m.role !== "auditor");

		if (contributingMembers.length === 0) return null;

		const turnOrderPolicy = group?.turnOrderPolicy || "fixed";

		// Find members who have already received payouts (executed)
		const executedPayouts = cycles
			.filter((c) => c.payoutExecuted)
			.map((c) => c.payoutRecipientId);

		if (turnOrderPolicy === "randomized") {
			// For randomized, find eligible members but note it will be random
			const eligibleMembers = contributingMembers.filter(
				(m) => !executedPayouts.includes(m.id)
			);

			if (eligibleMembers.length > 0) {
				// Show first eligible with note that actual will be random
				return eligibleMembers[0];
			}
			// Everyone has received, show first member with note
			return contributingMembers[0];
		}

		// For fixed policy, use sequential order
		const payoutOrder =
			group?.payoutOrder ||
			contributingMembers
				.sort(
					(a, b) =>
						new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
				)
				.map((m) => m.id);

		// Find next member in order who hasn't received yet
		for (const memberId of payoutOrder) {
			if (!executedPayouts.includes(memberId)) {
				return contributingMembers.find((m) => m.id === memberId);
			}
		}

		// If everyone has received, start new round with first member
		return (
			contributingMembers.find((m) => m.id === payoutOrder[0]) ||
			contributingMembers[0]
		);
	};

	const getCurrentCycleRecipient = () => {
		const activeCycle = cycles.find((c) => c.status === "active");
		if (!activeCycle) return null;
		return members.find((m) => m.id === activeCycle.payoutRecipientId);
	};

	const nextRecipient = getNextPayoutRecipient();
	const currentRecipient = getCurrentCycleRecipient();
	const isCurrentCycle = currentRecipient?.id === nextRecipient?.id;

	if (!nextRecipient) {
		return null;
	}

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	// Calculate position in queue
	const contributingMembers = members.filter((m) => m.role !== "auditor");
	const payoutOrder =
		group?.payoutOrder ||
		contributingMembers
			.sort(
				(a, b) =>
					new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
			)
			.map((m) => m.id);

	const executedPayouts = cycles
		.filter((c) => c.payoutExecuted)
		.map((c) => c.payoutRecipientId);

	const remainingInCurrentRound = payoutOrder.filter(
		(id) => !executedPayouts.includes(id)
	).length;

	return (
		<Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ArrowRight className="w-5 h-5 text-blue-600" />
						<CardTitle className="text-lg">
							{isCurrentCycle ? "Current Payout" : "Next Payout"}
						</CardTitle>
					</div>
					<Badge variant={isCurrentCycle ? "default" : "secondary"}>
						{isCurrentCycle ? "Active" : "Upcoming"}
					</Badge>
				</div>
				<CardDescription>
					{isCurrentCycle
						? "Recipient for the current cycle"
						: "Recipient for the next cycle"}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-100">
					<Avatar className="w-14 h-14 border-2 border-blue-200">
						<AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
							{getInitials(nextRecipient.name)}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<p className="font-semibold text-lg text-blue-900">
							{nextRecipient.name}
						</p>
						<p className="text-sm text-blue-700">{nextRecipient.email}</p>
						{nextRecipient.payoutAccount?.accountNumber && (
							<p className="text-xs text-muted-foreground mt-1">
								{nextRecipient.payoutAccount.accountNumber}
							</p>
						)}
						{group?.turnOrderPolicy === "randomized" && !isCurrentCycle && (
							<p className="text-xs text-orange-600 mt-1">
								⚠️ Preview only - actual recipient will be randomly selected
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Users className="w-4 h-4" />
						<span>
							{remainingInCurrentRound} member
							{remainingInCurrentRound !== 1 ? "s" : ""} remaining in queue
						</span>
					</div>
				</div>

				{!isCurrentCycle && (
					<div className="text-xs text-muted-foreground pt-2 border-t">
						{group?.turnOrderPolicy === "fixed" && (
							<>
								💡 <strong>Fixed Order:</strong> Payout follows the joining
								sequence. Each member receives the pot once per round.
							</>
						)}
						{group?.turnOrderPolicy === "randomized" && (
							<>
								🎲 <strong>Randomized:</strong> Recipient is randomly selected
								from members who haven't received yet. Fair but unpredictable.
							</>
						)}
						{!group?.turnOrderPolicy && (
							<>
								💡 Payout order is automatically managed based on member joining
								sequence.
							</>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
