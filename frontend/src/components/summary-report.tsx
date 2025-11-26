import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Group, Cycle, Payment, Member, Transaction } from "../types";
import { generateCycleSummary, formatCurrency, formatDate } from "../lib/utils";
import { FileText, Download, Activity } from "lucide-react";
import { ActivityLogsModal } from "./activity-logs-modal";
import { useState } from "react";

interface SummaryReportProps {
	group: Group;
	cycles: Cycle[];
	payments: Payment[];
	members: Member[];
	transactions?: Transaction[];
	currentCycle?: Cycle;
}

export function SummaryReport({
	group,
	cycles,
	payments,
	members,
	transactions = [],
	currentCycle,
}: SummaryReportProps) {
	const [showActivityLogs, setShowActivityLogs] = useState(false);
	const activeCycle = currentCycle || cycles.find((c) => c.status === "active");

	// Calculate statistics
	const completedCycles = cycles.filter((c) => c.payoutExecuted);
	const totalContributions = completedCycles.reduce(
		(sum, c) => sum + (c.totalContributions || 0),
		0
	);
	const totalPenalties = completedCycles.reduce(
		(sum, c) => sum + (c.totalPenalties || 0),
		0
	);
	const totalPayout = completedCycles.reduce(
		(sum, c) => sum + (c.potTotal || 0),
		0
	);
	const averagePot =
		completedCycles.length > 0 ? totalPayout / completedCycles.length : 0;
	const completionRate =
		cycles.length > 0 ? (completedCycles.length / cycles.length) * 100 : 0;
	const onTimeCompletions = completedCycles.filter(
		(c) => c.completedOnTime
	).length;
	const onTimeRate =
		completedCycles.length > 0
			? (onTimeCompletions / completedCycles.length) * 100
			: 0;
	const averageParticipation =
		completedCycles.length > 0
			? completedCycles.reduce(
					(sum, c) => sum + (c.participationRate || 100),
					0
			  ) / completedCycles.length
			: 100;

	const generateReport = () => {
		if (!activeCycle) return "";

		const cyclePayments = payments.filter((p) => p.cycleId === activeCycle.id);
		const paidPayments = cyclePayments.filter((p) => p.status === "paid");
		const recipient = members.find(
			(m) => m.id === activeCycle.payoutRecipientId
		);

		return generateCycleSummary(
			activeCycle.cycleNumber,
			paidPayments.length,
			members.filter((m) => m.role !== "auditor").length,
			paidPayments.reduce((sum, p) => sum + p.amount, 0),
			recipient?.name || "Unknown",
			activeCycle.deadline,
			group.currency
		);
	};

	const getAllReports = () => {
		return cycles
			.filter((c) => c.status !== "upcoming")
			.map((cycle) => {
				const cyclePayments = payments.filter((p) => p.cycleId === cycle.id);
				const paidPayments = cyclePayments.filter((p) => p.status === "paid");
				const recipient = members.find((m) => m.id === cycle.payoutRecipientId);

				return {
					cycle,
					summary: generateCycleSummary(
						cycle.cycleNumber,
						paidPayments.length,
						members.filter((m) => m.role !== "auditor").length,
						paidPayments.reduce((sum, p) => sum + p.amount, 0),
						recipient?.name || "Unknown",
						cycle.deadline,
						group.currency
					),
					recipient,
					paidCount: paidPayments.length,
					totalPenalties: cyclePayments.reduce((sum, p) => sum + p.penalty, 0),
				};
			});
	};

	const currentReport = generateReport();
	const allReports = getAllReports();

	const handleExportCSV = () => {
		// Generate CSV content
		const headers = [
			"Cycle",
			"Month",
			"Status",
			"Paid/Total",
			"Pot Total",
			"Penalties",
			"Payout To",
			"Payout Status",
			"Summary",
		];
		const rows = allReports.map((r) => [
			r.cycle.cycleNumber,
			formatDate(r.cycle.month),
			r.cycle.status,
			`${r.paidCount}/${members.filter((m) => m.role !== "auditor").length}`,
			r.cycle.potTotal,
			r.totalPenalties,
			r.recipient?.name || "",
			r.cycle.payoutExecuted ? "Completed" : "Pending",
			`"${r.summary}"`,
		]);

		const csvContent = [headers, ...rows]
			.map((row) => row.join(","))
			.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${group.name.replace(/\s+/g, "_")}_Report_${
			new Date().toISOString().split("T")[0]
		}.csv`;
		a.click();
	};

	const handleSendEmail = () => {
		alert(
			"Email functionality would integrate with your email service provider"
		);
	};

	return (
		<div className="space-y-6">
			{/* Group Statistics Overview */}
			<Card>
				<CardHeader>
					<CardTitle>Group Statistics</CardTitle>
					<CardDescription>Overall performance and metrics</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Total Cycles</p>
							<p className="text-2xl font-bold">{cycles.length}</p>
							<p className="text-xs text-muted-foreground">
								{completedCycles.length} completed
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Completion Rate</p>
							<p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
							<p className="text-xs text-muted-foreground">
								{onTimeRate.toFixed(0)}% on-time
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Total Contributions
							</p>
							<p className="text-2xl font-bold">
								{formatCurrency(totalContributions, group.currency)}
							</p>
							<p className="text-xs text-muted-foreground">
								+{formatCurrency(totalPenalties, group.currency)} penalties
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Average Pot</p>
							<p className="text-2xl font-bold">
								{formatCurrency(averagePot, group.currency)}
							</p>
							<p className="text-xs text-muted-foreground">
								{averageParticipation.toFixed(0)}% avg participation
							</p>
						</div>
					</div>

					{completedCycles.length > 0 && (
						<div className="mt-4 pt-4 border-t space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									Total Payouts Executed:
								</span>
								<span className="font-medium">
									{formatCurrency(totalPayout, group.currency)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									Base Contributions:
								</span>
								<span className="font-medium">
									{formatCurrency(totalContributions, group.currency)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									Late Penalties Collected:
								</span>
								<span className="font-medium">
									{formatCurrency(totalPenalties, group.currency)}
								</span>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Current Month Summary */}
			{currentReport &&
				(() => {
					const cyclePayments = payments.filter(
						(p) => p.cycleId === activeCycle?.id
					);
					const paidPayments = cyclePayments.filter((p) => p.status === "paid");
					const totalMembers = members.filter(
						(m) => m.role !== "auditor"
					).length;
					const potTotal = paidPayments.reduce((sum, p) => sum + p.amount, 0);
					const recipient = members.find(
						(m) => m.id === activeCycle?.payoutRecipientId
					);
					const deadlineDays = activeCycle
						? Math.ceil(
								(new Date(activeCycle.deadline).getTime() -
									new Date().getTime()) /
									(1000 * 60 * 60 * 24)
						  )
						: 0;

					return (
						<Card className="bg-blue-50 border-blue-200">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-blue-900 text-xl">
											Current Month Summary
										</CardTitle>
									</div>
									<Badge variant="default">Active</Badge>
								</div>
							</CardHeader>
							<CardContent className="pt-3">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="space-y-1">
										<p className="text-sm text-blue-600 font-medium">Cycle</p>
										<p className="text-lg font-semibold text-blue-900">
											Month {activeCycle?.cycleNumber}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-blue-600 font-medium">
											Payment Status
										</p>
										<p className="text-lg font-semibold text-blue-900">
											{paidPayments.length}/{totalMembers} paid
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-blue-600 font-medium">
											Pot Total
										</p>
										<p className="text-lg font-semibold text-blue-900">
											{formatCurrency(potTotal, group.currency)}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-blue-600 font-medium">
											Recipient
										</p>
										<p className="text-lg font-semibold text-blue-900">
											{recipient?.name || "Unknown"}
										</p>
									</div>
								</div>

								<div className="mt-4 pt-4 border-t border-blue-200">
									<div className="space-y-1">
										<p className="text-sm text-blue-600 font-medium">
											Payout Status
										</p>
										<p className="text-base text-blue-900">
											{deadlineDays > 0
												? `Scheduled in ${deadlineDays} days`
												: deadlineDays === 0
												? "Scheduled today"
												: `Overdue by ${Math.abs(deadlineDays)} days`}
											{totalMembers - paidPayments.length > 0 &&
												` • ${totalMembers - paidPayments.length} pending`}
										</p>
									</div>
								</div>

								<div className="flex gap-2 mt-4 pt-4 border-t border-blue-200">
									<Button
										variant="outline"
										size="sm"
										className="gap-2"
										onClick={() => setShowActivityLogs(true)}
									>
										<Activity className="w-4 h-4" />
										Activity Logs
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})()}

			{/* Historical Reports */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle>Historical Reports</CardTitle>
							<CardDescription>All monthly cycle summaries</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportCSV}
								className="gap-2"
							>
								<Download className="w-4 h-4" />
								Export CSV
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowActivityLogs(true)}
								className="gap-2"
							>
								<Activity className="w-4 h-4" />
								Activity Logs
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					{allReports.map((report) => (
						<div
							key={report.cycle.id || report.cycle.cycleNumber}
							className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
						>
							<div className="flex items-start justify-between mb-2">
								<div className="flex items-center gap-2">
									<FileText className="w-4 h-4 text-muted-foreground" />
									<span>
										Month {report.cycle.cycleNumber} -{" "}
										{formatDate(report.cycle.month)}
									</span>
								</div>
								<Badge
									variant={
										report.cycle.status === "completed"
											? "default"
											: report.cycle.status === "active"
											? "secondary"
											: "outline"
									}
								>
									{report.cycle.status}
								</Badge>
							</div>

							<p className="text-muted-foreground mb-3">{report.summary}</p>

							{report.cycle.payoutExecuted && (
								<div className="bg-green-50 border border-green-200 rounded px-3 py-2">
									<p className="text-green-700">
										✓ Payout of{" "}
										{formatCurrency(report.cycle.potTotal, group.currency)}{" "}
										completed on {formatDate(report.cycle.payoutExecutedAt!)}
										{report.cycle.payoutProof &&
											` (Ref: ${report.cycle.payoutProof})`}
									</p>
								</div>
							)}

							{report.totalPenalties > 0 && (
								<div className="bg-orange-50 border border-orange-200 rounded px-3 py-2 mt-2">
									<p className="text-orange-700">
										Total penalties collected:{" "}
										{formatCurrency(report.totalPenalties, group.currency)}
									</p>
								</div>
							)}
						</div>
					))}
					{allReports.length === 0 && (
						<p className="text-center text-muted-foreground py-8">
							No reports available yet. Reports will be generated as cycles
							progress.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Group Summary */}
			<Card>
				<CardHeader>
					<CardTitle>Overall Group Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-1">
							<p className="text-muted-foreground">Total Cycles</p>
							<p>
								{cycles.length} (
								{cycles.filter((c) => c.status === "completed").length}{" "}
								completed)
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Total Members</p>
							<p>
								{members.length} (
								{members.filter((m) => m.role !== "auditor").length}{" "}
								contributors)
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Group Status</p>
							<Badge
								variant={group.status === "active" ? "default" : "secondary"}
							>
								{group.status}
							</Badge>
						</div>
					</div>

					<div className="pt-4 border-t">
						<p className="text-muted-foreground mb-2">Group Progress</p>
						<div className="flex items-center gap-4">
							<div className="flex-1 bg-secondary rounded-full h-3">
								<div
									className="bg-primary rounded-full h-3 transition-all"
									style={{
										width: `${
											(cycles.filter((c) => c.status === "completed").length /
												group.duration) *
											100
										}%`,
									}}
								/>
							</div>
							<span>
								{Math.round(
									(cycles.filter((c) => c.status === "completed").length /
										group.duration) *
										100
								)}
								%
							</span>
						</div>
					</div>

					<div className="bg-muted rounded-lg p-4 mt-4">
						<p>
							<span className="text-muted-foreground">
								Expected completion:
							</span>{" "}
							{(() => {
								if (
									!group.startMonth ||
									isNaN(Date.parse(group.startMonth)) ||
									typeof group.duration !== "number"
								) {
									return "-";
								}
								const start = new Date(group.startMonth);
								if (isNaN(start.getTime())) return "-";
								start.setMonth(start.getMonth() + group.duration);
								return formatDate(start.toISOString());
							})()}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Activity Logs Modal */}
			<ActivityLogsModal
				groupId={group.id || ""}
				open={showActivityLogs}
				onClose={() => setShowActivityLogs(false)}
			/>
		</div>
	);
}
