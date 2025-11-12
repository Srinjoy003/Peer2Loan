import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Cycle, Payment, Member, Group } from "../types";
import { formatCurrency, formatDate, calculateDaysUntil } from "../lib/utils";
import {
	CheckCircle2,
	Clock,
	AlertCircle,
	XCircle,
	ArrowRight,
	Upload,
} from "lucide-react";

interface CycleDashboardProps {
	cycle: Cycle;
	payments: Payment[];
	members: Member[];
	group: Group;
	isAdmin: boolean;
	currentUserEmail: string;
	onRecordPayment?: (memberId: string) => void;
	onExecutePayout?: () => void;
	onMakePayment?: () => void;
}

export function CycleDashboard({
	cycle,
	payments,
	members,
	group,
	isAdmin,
	currentUserEmail,
	onRecordPayment,
	onExecutePayout,
	onMakePayment,
}: CycleDashboardProps) {
	if (!cycle) {
		return (
			<div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
				No cycle data available.
			</div>
		);
	}
	const cyclePayments = payments.filter((p) => p.cycleId === cycle.id);

	console.log("=== CYCLE DASHBOARD RENDER ===");
	console.log("All payments:", payments);
	console.log("Cycle ID:", cycle.id, "Type:", typeof cycle.id);
	console.log("Filtered cycle payments:", cyclePayments);
	if (cyclePayments.length > 0) {
		console.log("First cyclePayment:", cyclePayments[0]);
		console.log("  Status:", cyclePayments[0].status);
		console.log("  Status type:", typeof cyclePayments[0].status);
	}

	console.log("Cycle Dashboard Debug:", {
		cycleId: cycle.id,
		cycleIdType: typeof cycle.id,
		totalPayments: payments.length,
		cyclePayments: cyclePayments.length,
		isAdmin,
		currentUserEmail,
		samplePayment: payments[0] || "no payments",
		allPaymentsCycleIds: payments.map((p) => ({
			id: p.id,
			cycleId: p.cycleId,
			cycleIdType: typeof p.cycleId,
		})),
	});

	// Function to create payment records for this cycle
	const handleCreatePayments = async () => {
		try {
			const token = sessionStorage.getItem("token");
			const response = await fetch(
				`http://localhost:4000/api/cycles/${cycle.id}/create-payments`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error("Server error:", errorData);
				throw new Error(errorData.error || "Failed to create payment records");
			}

			const result = await response.json();
			alert(result.message);
			// Reload the page to show new payments
			window.location.reload();
		} catch (error) {
			console.error("Error creating payments:", error);
			alert("Failed to create payment records: " + error.message);
		}
	};

	const paidPayments = cyclePayments.filter((p) => p.status === "paid");
	const pendingPayments = cyclePayments.filter(
		(p) => p.status === "pending" || p.status === "late"
	);
	const pendingApprovalPayments = cyclePayments.filter(
		(p) => p.status === "pending_approval"
	);

	const paidCount = paidPayments.length;
	const totalCount = members.filter((m) => m.role !== "auditor").length;
	const progressPercentage = (paidCount / totalCount) * 100;

	const potTotal = paidPayments.reduce((sum, p) => sum + p.amount, 0);
	const totalPenalties = cyclePayments.reduce((sum, p) => sum + p.penalty, 0);

	// Resolve payout recipient by id when available, otherwise fall back to matching by email
	const payoutRecipient = members.find(
		(m) =>
			((cycle.payoutRecipientId &&
				m.id === cycle.payoutRecipientId) as boolean) ||
			((cycle as any).targetPayoutMemberId &&
				m.email === (cycle as any).targetPayoutMemberId) ||
			((cycle.payoutRecipientId &&
				m.email === cycle.payoutRecipientId) as boolean)
	);
	const daysUntilDeadline = calculateDaysUntil(cycle.deadline);

	const quorumMet =
		(paidCount / totalCount) * 100 >= group.rules.quorumPercentage;

	const getPaymentStatus = (memberId: string) => {
		const payment = cyclePayments.find((p) => p.memberId === memberId);
		console.log(`getPaymentStatus for memberId ${memberId}:`, {
			found: !!payment,
			payment: payment,
			allMemberIds: cyclePayments.map((p) => p.memberId),
			memberIdType: typeof memberId,
			paymentMemberIdTypes: cyclePayments.map((p) => typeof p.memberId),
		});
		if (!payment) return null;
		return payment;
	};

	const getStatusIcon = (status: string, payment?: Payment) => {
		// If payment is pending but has rejection info, show as rejected
		const effectiveStatus =
			status === "pending" && payment?.rejectedAt && !payment?.proof
				? "rejected"
				: status;

		switch (effectiveStatus) {
			case "paid":
				return <CheckCircle2 className="w-4 h-4 text-green-600" />;
			case "pending":
				return <Clock className="w-4 h-4 text-yellow-600" />;
			case "pending_approval":
				return <Clock className="w-4 h-4 text-orange-500" />;
			case "late":
				return <AlertCircle className="w-4 h-4 text-orange-600" />;
			case "rejected":
				return <XCircle className="w-4 h-4 text-red-600" />;
			case "defaulted":
				return <XCircle className="w-4 h-4 text-red-600" />;
			default:
				return null;
		}
	};

	const getStatusBadge = (status: string, payment?: Payment) => {
		// If payment is pending but has rejection info, show as rejected
		const effectiveStatus =
			status === "pending" && payment?.rejectedAt && !payment?.proof
				? "rejected"
				: status;

		const variants: Record<
			string,
			"default" | "secondary" | "destructive" | "outline"
		> = {
			paid: "default",
			pending: "secondary",
			late: "destructive",
			defaulted: "destructive",
			pending_approval: "outline",
			rejected: "destructive",
		};

		const labels: Record<string, string> = {
			pending_approval: "Pending Approval",
			rejected: "Rejected",
		};

		return (
			<Badge variant={variants[effectiveStatus] || "outline"}>
				{labels[effectiveStatus] || effectiveStatus}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			{/* Warning: No payment records */}
			{cyclePayments.length === 0 && isAdmin && (
				<Card className="border-red-200 bg-red-50">
					<CardHeader>
						<CardTitle className="text-red-700">
							⚠️ No Payment Records Found
						</CardTitle>
						<CardDescription className="text-red-600">
							This cycle has no payment records. Members cannot make payments
							until payment records are created.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={handleCreatePayments} variant="destructive">
							Create Payment Records for All Members
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Cycle Header */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle>
								Month {cycle.cycleNumber} - {formatDate(cycle.month)}
							</CardTitle>
							<CardDescription>
								Payout to: {payoutRecipient?.name}
								{payoutRecipient?.payoutAccount && (
									<>
										{" "}
										({payoutRecipient.payoutAccount.accountHolderName}
										{payoutRecipient.payoutAccount.accountNumber
											? ` — ${payoutRecipient.payoutAccount.accountNumber}`
											: ""}
										{payoutRecipient.payoutAccount.ifscCode
											? `, ${payoutRecipient.payoutAccount.ifscCode}`
											: ""}
										)
									</>
								)}
							</CardDescription>
						</div>
						<div className="flex flex-col gap-2 items-end">
							<Badge
								variant={cycle.status === "active" ? "default" : "secondary"}
							>
								{cycle.status}
							</Badge>
							{isAdmin &&
								pendingApprovalPayments.length > 0 &&
								onRecordPayment && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											// Open modal with first pending payment (modal will show all)
											const firstPending = pendingApprovalPayments[0];
											if (firstPending) {
												onRecordPayment(firstPending.memberId);
											}
										}}
									>
										Verify Payments ({pendingApprovalPayments.length})
									</Button>
								)}
						</div>
					</div>
				</CardHeader>{" "}
				<CardContent className="space-y-4">
					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Payment Progress</span>
							<span>
								{paidCount} / {totalCount} paid (
								{Math.round(progressPercentage)}%)
							</span>
						</div>
						<Progress value={progressPercentage} className="h-3" />
					</div>
					{/* Key Metrics */}
					<div className="grid grid-cols-4 gap-4 pt-4">
						<div className="space-y-1">
							<p className="text-muted-foreground">Pot Total</p>
							<p>{formatCurrency(potTotal, group.currency)}</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Penalties</p>
							<p className="text-orange-600">
								{formatCurrency(totalPenalties, group.currency)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Deadline</p>
							<p>
								{daysUntilDeadline > 0
									? `${daysUntilDeadline} days`
									: daysUntilDeadline === 0
									? "Today"
									: `${Math.abs(daysUntilDeadline)} days overdue`}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Quorum Status</p>
							<p className={quorumMet ? "text-green-600" : "text-orange-600"}>
								{quorumMet ? "✓ Met" : "✗ Not Met"}
							</p>
						</div>
					</div>
					{/* Make Payment Action (Non-Admin Members) */}
					{!isAdmin && onMakePayment && cycle.status === "active" && (
						<div className="pt-4 border-t">
							{(() => {
								const userPayment = cyclePayments.find(
									(p) =>
										members.find((m) => m.id === p.memberId)?.email ===
										currentUserEmail
								);

								console.log("🎯 Make Payment Action Section:", {
									currentUserEmail,
									userPayment: userPayment,
									cyclePayments: cyclePayments.length,
									allPaymentMemberIds: cyclePayments.map((p) => p.memberId),
								});

								// If no payment record found, show Make Payment button
								if (!userPayment) {
									return (
										<div className="space-y-2">
											<div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
												<p className="flex items-center gap-2 text-yellow-700">
													<AlertCircle className="w-5 h-5" />
													No payment record found for this cycle
												</p>
											</div>
											<Button onClick={onMakePayment} className="w-full gap-2">
												<Upload className="w-4 h-4" />
												Make Payment
											</Button>
										</div>
									);
								}

								if (userPayment.status === "paid") {
									return (
										<div className="bg-green-50 border border-green-200 p-4 rounded-md">
											<p className="flex items-center gap-2 text-green-700">
												<CheckCircle2 className="w-5 h-5" />
												Your payment has been recorded
												{userPayment.paidOn &&
													` on ${formatDate(userPayment.paidOn)}`}
											</p>
										</div>
									);
								}

								if (userPayment.status === "pending_approval") {
									return (
										<div className="bg-orange-50 border border-orange-200 p-4 rounded-md">
											<p className="flex items-center gap-2 text-orange-700">
												<Clock className="w-5 h-5" />
												Your payment request is awaiting admin approval
											</p>
										</div>
									);
								}

								// Check if payment was recently rejected (status is pending but has rejection info)
								if (
									userPayment.status === "pending" &&
									userPayment.rejectedAt &&
									!userPayment.proof
								) {
									return (
										<div className="space-y-2">
											<div className="bg-red-50 border border-red-200 p-4 rounded-md space-y-2">
												<p className="flex items-center gap-2 text-red-700 font-semibold">
													<XCircle className="w-5 h-5" />
													Your payment request was rejected
												</p>
												{userPayment.rejectionReason && (
													<p className="text-sm text-red-600">
														<strong>Reason:</strong>{" "}
														{userPayment.rejectionReason}
													</p>
												)}
												{userPayment.rejectedAt && (
													<p className="text-xs text-red-500">
														Rejected on {formatDate(userPayment.rejectedAt)}
													</p>
												)}
											</div>
											<Button onClick={onMakePayment} className="w-full gap-2">
												<Upload className="w-4 h-4" />
												Submit New Payment Request
											</Button>
										</div>
									);
								}

								if (userPayment.status === "rejected") {
									return (
										<div className="bg-red-50 border border-red-200 p-4 rounded-md space-y-2">
											<p className="flex items-center gap-2 text-red-700">
												<XCircle className="w-5 h-5" />
												Your payment request was rejected
											</p>
											{userPayment.rejectionReason && (
												<p className="text-sm text-red-600">
													Reason: {userPayment.rejectionReason}
												</p>
											)}
											<Button
												onClick={onMakePayment}
												size="sm"
												variant="outline"
												className="mt-2"
											>
												Submit New Payment Request
											</Button>
										</div>
									);
								}

								// Status is pending, late, or defaulted
								return (
									<Button onClick={onMakePayment} className="w-full gap-2">
										<Upload className="w-4 h-4" />
										Make Payment (
										{formatCurrency(userPayment.amount, group.currency)})
									</Button>
								);
							})()}
						</div>
					)}{" "}
					{/* Payout Action */}
					{cycle.status === "active" &&
						quorumMet &&
						!cycle.payoutExecuted &&
						isAdmin && (
							<div className="pt-4 border-t">
								<Button onClick={onExecutePayout} className="w-full gap-2">
									Execute Payout to {payoutRecipient?.name}
									<ArrowRight className="w-4 h-4" />
								</Button>
							</div>
						)}
					{cycle.payoutExecuted && (
						<div className="pt-4 border-t bg-green-50 p-4 rounded-md">
							<p className="flex items-center gap-2 text-green-700">
								<CheckCircle2 className="w-5 h-5" />
								Payout executed on {formatDate(cycle.payoutExecutedAt!)}
								{cycle.payoutProof && ` (Ref: ${cycle.payoutProof})`}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Payment Status Table */}
			<Card>
				<CardHeader>
					<CardTitle>Payment Status</CardTitle>
					<CardDescription>
						Who has paid and who's pending for this cycle
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="space-y-2">
						{(() => {
							console.log("=== PAYMENT STATUS TABLE ===");
							console.log(
								"Members to display:",
								members.filter((m) => m.role !== "auditor")
							);
							console.log("Cycle payments:", cyclePayments);
							return null;
						})()}
						{members
							.filter((m) => m.role !== "auditor")
							.map((member) => {
								const payment = getPaymentStatus(member.id);

								// Show all members, even if payment record is missing
								if (!payment) {
									console.warn(
										`⚠️ No payment found for member ${member.name} (${member.id})`
									);
									return (
										<div
											key={member.id}
											className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
										>
											<div className="flex items-center gap-4">
												<AlertCircle className="w-4 h-4 text-yellow-600" />
												<div>
													<p>{member.name}</p>
													<p className="text-muted-foreground">
														{member.email}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-4">
												<div className="text-yellow-600 text-sm">
													No payment record found
												</div>
												{member.email === currentUserEmail && onMakePayment && (
													<Button
														size="sm"
														variant="default"
														onClick={onMakePayment}
													>
														Make Payment
													</Button>
												)}
											</div>
										</div>
									);
								}
								return (
									<div
										key={member.id}
										className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
									>
										<div className="flex items-center gap-4">
											{getStatusIcon(payment.status, payment)}
											<div>
												<p>{member.name}</p>
												<p className="text-muted-foreground">{member.email}</p>
											</div>
										</div>

										<div className="flex items-center gap-4">
											{payment.status === "paid" && payment.paidOn && (
												<span className="text-muted-foreground">
													Paid on {formatDate(payment.paidOn)}
												</span>
											)}

											{payment.penalty > 0 && (
												<span className="text-orange-600">
													+{formatCurrency(payment.penalty, group.currency)} fee
												</span>
											)}

											<div className="w-24">
												{getStatusBadge(payment.status, payment)}
											</div>

											{payment.status !== "paid" &&
												!isAdmin &&
												member.email === currentUserEmail &&
												onMakePayment && (
													<>
														{payment.status === "pending_approval" ? (
															<Button
																size="sm"
																variant="outline"
																disabled
																className="opacity-60"
															>
																<Clock className="w-4 h-4 mr-2" />
																Pending Approval
															</Button>
														) : (
															<Button
																size="sm"
																variant="default"
																onClick={onMakePayment}
															>
																Make Payment
															</Button>
														)}
													</>
												)}
										</div>
									</div>
								);
							})}
					</div>
				</CardContent>
			</Card>
			{/* Pending Members Alert - Admin Only */}
			{isAdmin && pendingPayments.length > 0 && (
				<Card className="border-orange-200 bg-orange-50">
					<CardHeader>
						<CardTitle className="text-orange-700">Pending Payments</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-orange-600">
							{pendingPayments.length} member(s) have not yet contributed for
							this cycle. Automatic reminders will be sent daily until payment
							is received.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
