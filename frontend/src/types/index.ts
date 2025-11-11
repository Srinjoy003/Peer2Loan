// Type definitions for Peer2Loan application

export type TurnOrderPolicy = "fixed" | "randomized" | "rule-based";
export type UserRole = "admin" | "member" | "auditor";
export type PaymentStatus = "pending" | "paid" | "late" | "defaulted";
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
	payoutExecuted: boolean;
	payoutExecutedAt?: string;
	payoutProof?: string;
	notes?: string;
}

export interface Payment {
	id: string;
	cycleId: string;
	memberId: string;
	amount: number;
	paidOn?: string; // ISO date
	proof?: string;
	status: PaymentStatus;
	penalty: number;
	createdAt: string;
	updatedAt: string;
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
