import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Payment, Member, Cycle, Group, MemberStats } from "../types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "₹"): string {
	if (typeof amount !== "number" || isNaN(amount)) {
		return `${currency}-`;
	}
	return `${currency}${amount.toLocaleString("en-IN")}`;
}

export function formatDate(date: string): string {
	return new Date(date).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatMonthYear(date: string): string {
	return new Date(date).toLocaleDateString("en-IN", {
		month: "long",
		year: "numeric",
	});
}

export function calculateDaysUntil(date: string): number {
	const target = new Date(date);
	const today = new Date();
	const diff = target.getTime() - today.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculateLateFee(
	daysLate: number,
	feePerDay: number,
	maxFee: number
): number {
	return Math.min(daysLate * feePerDay, maxFee);
}

export function calculateMemberStats(
	memberId: string,
	payments: Payment[],
	cycles: Cycle[],
	group: Group
): MemberStats {
	const memberPayments = payments.filter((p) => p.memberId === memberId);
	const paidPayments = memberPayments.filter((p) => p.status === "paid");
	const latePayments = memberPayments.filter(
		(p) => p.status === "late" || p.penalty > 0
	);

	const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
	const totalPenalties = memberPayments.reduce((sum, p) => sum + p.penalty, 0);
	const totalArrears = memberPayments
		.filter((p) => p.status === "pending" || p.status === "late")
		.reduce((sum, p) => sum + p.amount, 0);

	const payoutCycle = cycles.find(
		(c) => c.payoutRecipientId === memberId && c.payoutExecuted
	);
	const payoutAmount = payoutCycle ? payoutCycle.potTotal : 0;

	const expectedContributions =
		cycles.filter((c) => c.status !== "upcoming").length *
		group.monthlyContribution;
	const netPosition = payoutAmount - (totalPaid + totalPenalties);

	const completionPercentage =
		expectedContributions > 0
			? Math.round((totalPaid / expectedContributions) * 100)
			: 0;

	// Calculate on-time streak (consecutive cycles without late payments)
	// Sort cycles by cycle number and match with payments
	const sortedCycles = cycles
		.filter((c) => c.status !== "upcoming")
		.sort((a, b) => b.cycleNumber - a.cycleNumber); // Most recent first

	let onTimeStreak = 0;
	for (const cycle of sortedCycles) {
		const cyclePayment = memberPayments.find((p) => p.cycleId === cycle.id);
		if (!cyclePayment) break; // No payment record for this cycle

		// Check if payment was late (has penalty or late status)
		const wasLate = cyclePayment.penalty > 0 || cyclePayment.status === "late";

		if (wasLate) {
			break; // Streak ends at first late payment
		} else if (cyclePayment.status === "paid") {
			onTimeStreak++; // Only count paid payments (not pending/pending_approval)
		}
	}

	return {
		memberId,
		totalContributions: memberPayments.length,
		totalPaid,
		totalArrears,
		totalPenalties,
		payoutReceived: !!payoutCycle,
		payoutAmount,
		netPosition,
		onTimePayments: paidPayments.length - latePayments.length,
		latePayments: latePayments.length,
		completionPercentage,
		onTimeStreak,
	};
}

export function generateCycleSummary(
	cycleNumber: number,
	paidCount: number,
	totalMembers: number,
	potTotal: number,
	recipientName: string,
	deadline: string,
	currency: string
): string {
	const pendingCount = totalMembers - paidCount;
	const deadlineDays = calculateDaysUntil(deadline);

	let summary = `Month ${cycleNumber}: ${paidCount}/${totalMembers} paid; `;
	summary += `Pot ${formatCurrency(potTotal, currency)}; `;
	summary += `Payout to ${recipientName} `;

	if (deadlineDays > 0) {
		summary += `scheduled in ${deadlineDays} days`;
	} else if (deadlineDays === 0) {
		summary += `scheduled today`;
	} else {
		summary += `overdue by ${Math.abs(deadlineDays)} days`;
	}

	if (pendingCount > 0) {
		summary += `; ${pendingCount} pending`;
	}

	return summary + ".";
}

export function getTurnOrder(members: Member[], policy: string): string[] {
	const contributingMembers = members.filter((m) => m.role !== "auditor");

	switch (policy) {
		case "fixed":
			return contributingMembers.map((m) => m.id);
		case "randomized":
			return [...contributingMembers]
				.sort(() => Math.random() - 0.5)
				.map((m) => m.id);
		case "rule-based":
			// In real implementation, this would use admin-defined rules
			return contributingMembers.map((m) => m.id);
		default:
			return contributingMembers.map((m) => m.id);
	}
}
