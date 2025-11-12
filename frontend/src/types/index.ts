// Type definitions for Peer2Loan application

export type TurnOrderPolicy = "fixed" | "randomized" | "rule-based";
export type UserRole = "admin" | "member" | "auditor";
export type PaymentStatus =
	| "pending"
	| "paid"
	| "late"
	| "defaulted"
	| "pending_approval"
	| "rejected";
export type CycleStatus = "upcoming" | "active" | "completed" | "defaulted";

export interface Group {
	id?: string;
	name: string;
	currency: string;
	monthlyContribution: number;
	groupSize: number;
	startMonth: string; // ISO date
	duration: number; // months
	paymentWindow: {
		startDay: number;
		endDay: number;
	};
	turnOrderPolicy: TurnOrderPolicy;
	rules: {
		gracePeriodDays: number;
		lateFeePerDay: number;
		lateFeeMax: number;
		quorumPercentage: number; // percentage of members that must pay
		allowReplacementMembers: boolean;
	};
	createdAt: string;
	status: "active" | "completed" | "cancelled";
	admin: string; // user id or email of admin
	members: string[]; // array of user ids or emails
}

export interface Member {
	id: string;
	groupId: string;
	name: string;
	email: string;
	phone: string;
	payoutAccount: {
		accountNumber: string;
		ifscCode: string;
		accountHolderName: string;
	};
	role: UserRole;
	emergencyContact?: {
		name: string;
		phone: string;
	};
	joinedAt: string;
	confirmedJoin: boolean;
}

export interface Cycle {
	id: string;
	groupId: string;
	cycleNumber: number;
	month: string; // ISO date
	payoutRecipientId: string;
	status: CycleStatus;
	deadline: string; // ISO date
	potTotal: number;
	totalContributions?: number;
	totalPenalties?: number;
	participationRate?: number;
	paidMemberCount?: number;
	totalMemberCount?: number;
	completedOnTime?: boolean;
	payoutExecuted: boolean;
	payoutExecutedAt?: string;
	payoutProof?: string;
	completedAt?: string;
	payoutExecutedBy?: string;
	notes?: string;
}

export interface Payment {
	id: string;
	cycleId: string;
	memberId: string;
	amount: number;
	contributionAmount?: number;
	penaltyAmount?: number;
	paidOn?: string; // ISO date
	proof?: string;
	status: PaymentStatus;
	penalty: number;
	createdAt: string;
	updatedAt: string;
	submittedAt?: string; // When member submitted payment request
	approvedBy?: string; // admin email
	rejectedBy?: string; // admin email
	rejectedAt?: string; // When payment was rejected
	rejectionReason?: string;
}

export interface Transaction {
	_id: string;
	groupId: string;
	cycleId: string;
	paymentId?: string;
	type: "contribution" | "penalty" | "payout";
	amount: number;
	memberId?: string;
	memberName?: string;
	recipientId?: string;
	executedBy: string;
	executedAt: string;
	reference: string;
	metadata?: {
		cycleNumber?: number;
		month?: string;
		contributions?: number;
		penalties?: number;
		memberCount?: number;
		participationRate?: number;
		completedOnTime?: boolean;
		penaltyAmount?: number;
		contributionAmount?: number;
		totalAmount?: number;
	};
}

export interface MemberStats {
	memberId: string;
	totalContributions: number;
	totalPaid: number;
	totalArrears: number;
	totalPenalties: number;
	payoutReceived: boolean;
	payoutAmount: number;
	netPosition: number;
	onTimePayments: number;
	latePayments: number;
	completionPercentage: number;
}

export interface CycleSummary {
	cycle: Cycle;
	payments: Payment[];
	paidCount: number;
	pendingCount: number;
	lateCount: number;
	potTotal: number;
	payoutRecipient: Member;
}

export interface Invitation {
	_id?: string;
	id?: string;
	groupId: string;
	groupName?: string;
	groupDetails?: Group;
	inviteeEmail: string;
	inviteeName: string;
	role: UserRole;
	memberData: Partial<Member>;
	status: "pending" | "accepted" | "rejected";
	createdAt: string;
	respondedAt?: string;
}
