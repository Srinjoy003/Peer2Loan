import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatDate } from "../lib/utils";
import {
	UserPlus,
	DollarSign,
	CheckCircle,
	XCircle,
	Mail,
	Clock,
} from "lucide-react";

interface ActivityLog {
	id: string;
	type:
		| "invitation"
		| "payment"
		| "acceptance"
		| "rejection"
		| "cycle"
		| "member";
	timestamp: string;
	description: string;
	actorName?: string;
	actorEmail?: string;
	targetName?: string;
	status?: string;
	amount?: number;
	currency?: string;
	transactionId?: string;
}

interface ActivityLogsModalProps {
	groupId: string;
	open: boolean;
	onClose: () => void;
}

export function ActivityLogsModal({
	groupId,
	open,
	onClose,
}: ActivityLogsModalProps) {
	const [logs, setLogs] = useState<ActivityLog[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open && groupId) {
			fetchActivityLogs();
		}
	}, [open, groupId]);

	const fetchActivityLogs = async () => {
		setLoading(true);
		try {
			const token = sessionStorage.getItem("token");
			const headers = token ? { Authorization: `Bearer ${token}` } : {};

			// Fetch all relevant data
			const [invitationsRes, paymentsRes, cyclesRes, membersRes] =
				await Promise.all([
					fetch(`/api/invitations?groupId=${groupId}`, { headers }),
					fetch(`/api/payments?groupId=${groupId}`, { headers }),
					fetch(`/api/cycles?groupId=${groupId}`, { headers }),
					fetch(`/api/members?groupId=${groupId}`, { headers }),
				]);

			const invitations = invitationsRes.ok ? await invitationsRes.json() : [];
			const payments = paymentsRes.ok ? await paymentsRes.json() : [];
			const cycles = cyclesRes.ok ? await cyclesRes.json() : [];
			const members = membersRes.ok ? await membersRes.json() : [];

			const activityLogs: ActivityLog[] = [];

			// Process payments
			payments.forEach((payment: any) => {
				if (payment.groupId === groupId) {
					const member = members.find(
						(m: any) => (m._id || m.id) === payment.memberId
					);
					const memberName = member?.name || member?.email || "Unknown";

					if (payment.status === "paid" && payment.paidOn) {
						activityLogs.push({
							id: `payment-${payment._id || payment.id}`,
							type: "payment",
							timestamp: payment.paidOn,
							description: `${memberName} made a payment`,
							actorName: memberName,
							status: "paid",
							amount: payment.amount,
							currency: payment.currency || "INR",
						});
					}

					if (payment.status === "rejected" && payment.rejectedAt) {
						activityLogs.push({
							id: `payment-reject-${payment._id || payment.id}`,
							type: "rejection",
							timestamp: payment.rejectedAt,
							description: `Payment from ${memberName} was rejected`,
							actorName: memberName,
							targetName: payment.rejectionReason,
							status: "rejected",
						});
					}
				}
			});

			// Process cycles
			cycles.forEach((cycle: any) => {
				if (cycle.groupId === groupId) {
					activityLogs.push({
						id: `cycle-${cycle._id || cycle.id}`,
						type: "cycle",
						timestamp: cycle.createdAt,
						description: `Cycle #${cycle.cycleNumber} created`,
						status: cycle.status,
					});

				if (cycle.payoutExecuted && cycle.payoutExecutedAt) {
					const recipient = members.find(
						(m: any) => (m._id || m.id) === cycle.payoutRecipientId
					);
					activityLogs.push({
						id: `payout-${cycle._id || cycle.id}`,
						type: "payment",
						timestamp: cycle.payoutExecutedAt,
						description: `Payout executed to ${recipient?.name || "Unknown"}`,
						targetName: recipient?.name,
						status: "completed",
						amount: cycle.potTotal,
						transactionId: cycle.transactionId,
					});
				}
			}
		});			// Process member additions
			members.forEach((member: any) => {
				if (member.groupId === groupId && member.joinedAt) {
					activityLogs.push({
						id: `member-${member._id || member.id}`,
						type: "member",
						timestamp: member.joinedAt,
						description: `${member.name} joined the group`,
						actorName: member.name,
						actorEmail: member.email,
						status: "joined",
					});
				}
			});

			// Sort by timestamp (most recent first)
			activityLogs.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			);

			setLogs(activityLogs);
		} catch (error) {
			console.error("Failed to fetch activity logs:", error);
		} finally {
			setLoading(false);
		}
	};

	const getIcon = (type: string, status?: string) => {
		switch (type) {
			case "invitation":
				return <Mail className="w-4 h-4" />;
			case "acceptance":
				return <CheckCircle className="w-4 h-4 text-green-600" />;
			case "rejection":
				return <XCircle className="w-4 h-4 text-red-600" />;
			case "payment":
				return status === "completed" ? (
					<CheckCircle className="w-4 h-4 text-green-600" />
				) : (
					<DollarSign className="w-4 h-4 text-blue-600" />
				);
			case "member":
				return <UserPlus className="w-4 h-4 text-purple-600" />;
			case "cycle":
				return <Clock className="w-4 h-4 text-orange-600" />;
			default:
				return <Clock className="w-4 h-4" />;
		}
	};

	const getStatusBadge = (type: string, status?: string) => {
		if (type === "invitation" && status) {
			if (status === "accepted")
				return <Badge variant="default">Accepted</Badge>;
			if (status === "rejected")
				return <Badge variant="destructive">Rejected</Badge>;
			if (status === "pending")
				return <Badge variant="secondary">Pending</Badge>;
		}
		if (type === "payment") {
			if (status === "paid") return <Badge variant="default">Paid</Badge>;
			if (status === "completed")
				return <Badge variant="default">Completed</Badge>;
			if (status === "rejected")
				return <Badge variant="destructive">Rejected</Badge>;
		}
		if (type === "cycle" && status) {
			if (status === "active") return <Badge variant="default">Active</Badge>;
			if (status === "completed")
				return <Badge variant="outline">Completed</Badge>;
		}
		return null;
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-background rounded-lg shadow-xl w-[800px] max-h-[75vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="px-6 py-4 border-b flex-shrink-0">
					<div className="flex items-start justify-between">
						<div>
							<h2 className="text-lg font-semibold">Activity Logs</h2>
							<p className="text-sm text-muted-foreground mt-1">
								Complete history of invitations, payments, and group activities
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<XCircle className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div
					className="overflow-y-auto px-6 py-4"
					style={{ maxHeight: "calc(75vh - 100px)" }}
				>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">Loading activity logs...</p>
						</div>
					) : logs.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">No activity logs found</p>
						</div>
					) : (
						<div className="space-y-3">
							{logs.map((log) => (
								<Card
									key={log.id}
									className="hover:bg-accent/50 transition-colors"
								>
									<CardContent className="p-4">
										<div className="flex items-start gap-3">
											<div className="mt-1">
												{getIcon(log.type, log.status)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between gap-2">
													<div className="flex-1">
													<p className="font-medium text-sm">
														{log.description}
													</p>
													{log.amount && (
														<p className="text-sm text-muted-foreground">
															Amount: {log.currency}{" "}
															{log.amount.toLocaleString()}
														</p>
													)}
													{log.transactionId && (
														<p className="text-sm text-muted-foreground">
															Transaction ID: {log.transactionId}
														</p>
													)}
													{log.targetName && log.type === "rejection" && (
														<p className="text-sm text-muted-foreground">
															Reason: {log.targetName}
														</p>
													)}
													</div>
													{getStatusBadge(log.type, log.status)}
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													{formatDate(log.timestamp)}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
