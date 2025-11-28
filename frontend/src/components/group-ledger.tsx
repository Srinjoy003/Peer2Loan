import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import { Group, Cycle, Payment, Member, Transaction } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";

interface GroupLedgerProps {
	group: Group;
	cycles: Cycle[];
	payments: Payment[];
	members: Member[];
	transactions?: Transaction[];
	adminName?: string; // Add admin name prop
}

export function GroupLedger2({
	group,
	cycles,
	payments,
	members,
	transactions = [],
	adminName,
}: GroupLedgerProps) {
	// Get theme-aware colors
	const isDark = document.documentElement.classList.contains("dark");
	const greenColors = {
		collected: isDark ? "#166534" : "#22c55e",
		payout: isDark ? "#14532d" : "#16a34a",
		penalties: isDark ? "#052e16" : "#15803d",
	};

	// Prepare chartData for recharts
	const chartData = cycles.map((cycle) => {
		const cyclePayments = payments.filter((p) => p.cycleId === cycle.id);
		const paidPayments = cyclePayments.filter((p) => p.status === "paid");
		const penalties = cyclePayments.reduce(
			(sum, p) => sum + (p.penalty || 0),
			0
		);
		const actualCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
		return {
			month: cycle.month
				? formatDate(cycle.month)
				: `Month ${cycle.cycleNumber}`,
			collected: actualCollected,
			// For executed payouts, use cycle.potTotal; for active cycles, show current collected amount
			payout: cycle.payoutExecuted
				? cycle.potTotal || actualCollected
				: actualCollected,
			penalties,
		};
	});

	// Prepare cycleStats for table and variance analysis
	const cycleStats = cycles.map((cycle) => {
		const cyclePayments = payments.filter((p) => p.cycleId === cycle.id);
		const paidPayments = cyclePayments.filter((p) => p.status === "paid");
		const totalMembers = members.filter((m) => m.role !== "auditor").length;
		const actualCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
		return {
			cycle,
			paidCount: paidPayments.length,
			totalMembers,
			totalCollected: actualCollected,
			totalPenalties: cyclePayments.reduce(
				(sum, p) => sum + (p.penalty || 0),
				0
			),
			// Always show actual collected amount to reflect current reality
			// This ensures accuracy even if members were added after cycle creation
			payoutAmount: actualCollected,
		};
	});
	if (!group || !group.rules) {
		return (
			<div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
				No group ledger data available.
			</div>
		);
	}
	return (
		<div className="space-y-6">
			{/* Cashflow Chart */}
			<Card>
				<CardHeader>
					<CardTitle>Cashflow Timeline</CardTitle>
					<CardDescription>
						Monthly collections, payouts, and penalties
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="month" />
							<YAxis />
							<Tooltip
								formatter={(value: number) =>
									formatCurrency(value, group.currency)
								}
							/>
							<Legend iconType="square" wrapperStyle={{ color: "inherit" }} />
							<Bar
								dataKey="collected"
								fill={greenColors.collected}
								name="Collected"
							/>
							<Bar dataKey="payout" fill={greenColors.payout} name="Payout" />
							<Bar
								dataKey="penalties"
								fill={greenColors.penalties}
								name="Penalties"
							/>
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Cycle-wise Breakdown */}
			<Card>
				<CardHeader>
					<CardTitle>Cycle-wise Breakdown</CardTitle>
					<CardDescription>Detailed view of each monthly cycle</CardDescription>
				</CardHeader>

				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Cycle</TableHead>
								<TableHead>Month</TableHead>
								<TableHead>Paid / Total</TableHead>
								<TableHead>Collected</TableHead>
								<TableHead>Penalties</TableHead>
								<TableHead>Payout</TableHead>
								<TableHead>Recipient</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{cycleStats.map((stat) => {
								const recipient = members.find(
									(m) => m.id === stat.cycle.payoutRecipientId
								);

								return (
									<TableRow key={stat.cycle.id}>
										<TableCell>Month {stat.cycle.cycleNumber}</TableCell>
										<TableCell>{formatDate(stat.cycle.month)}</TableCell>
										<TableCell>
											{stat.paidCount} / {stat.totalMembers}
											<span className="text-muted-foreground ml-2">
												(
												{Math.round((stat.paidCount / stat.totalMembers) * 100)}
												%)
											</span>
										</TableCell>
										<TableCell>
											{formatCurrency(stat.totalCollected, group.currency)}
										</TableCell>
										<TableCell
											className={
												stat.totalPenalties > 0 ? "text-orange-600" : ""
											}
										>
											{stat.totalPenalties > 0
												? formatCurrency(stat.totalPenalties, group.currency)
												: "-"}
										</TableCell>
										<TableCell
											className={stat.payoutAmount > 0 ? "text-green-600" : ""}
										>
											{stat.payoutAmount > 0
												? formatCurrency(stat.payoutAmount, group.currency)
												: "-"}
										</TableCell>
										<TableCell>{recipient?.name || "-"}</TableCell>
										<TableCell>
											<Badge
												variant={
													stat.cycle.status === "completed"
														? "default"
														: stat.cycle.status === "active"
														? "secondary"
														: "outline"
												}
											>
												{stat.cycle.status}
											</Badge>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Variance Analysis */}
			<Card>
				<CardHeader>
					<CardTitle>Variance Analysis</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{cycleStats.map((stat) => {
							const expectedCollection =
								stat.totalMembers * group.monthlyContribution;
							const variance = stat.totalCollected - expectedCollection;
							const variancePercentage = (variance / expectedCollection) * 100;

							if (variance === 0) return null;

							return (
								<div
									key={stat.cycle.id}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div>
										<p>Month {stat.cycle.cycleNumber}</p>
										<p className="text-muted-foreground">
											Expected:{" "}
											{formatCurrency(expectedCollection, group.currency)}
										</p>
									</div>
									<div className="text-right">
										<p
											className={
												variance >= 0 ? "text-green-600" : "text-red-600"
											}
										>
											{variance >= 0 ? "+" : ""}
											{formatCurrency(variance, group.currency)}
										</p>
										<p className="text-muted-foreground">
											{variancePercentage.toFixed(1)}%
										</p>
									</div>
								</div>
							);
						})}

						{cycleStats.every(
							(s) =>
								s.totalCollected === s.totalMembers * group.monthlyContribution
						) && (
							<p className="text-center text-muted-foreground py-8">
								No variances detected. All cycles collected the expected amount.
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function GroupLedger({
	group,
	cycles,
	payments,
	members,
	transactions = [],
	adminName,
}: GroupLedgerProps) {
	// Get theme-aware colors
	const isDark = document.documentElement.classList.contains("dark");
	const greenColors = {
		collected: isDark ? "#166534" : "#22c55e",
		payout: isDark ? "#14532d" : "#16a34a",
		penalties: isDark ? "#991b1b" : "#ef4444",
	};

	// Calculate cycle statistics
	const cycleStats = cycles.map((cycle) => {
		const cyclePayments = payments.filter((p) => p.cycleId === cycle.id);
		const paidPayments = cyclePayments.filter((p) => p.status === "paid");
		const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
		const totalPenalties = cyclePayments.reduce(
			(sum, p) => sum + (p.penalty || 0),
			0
		);
		const paidCount = paidPayments.length;
		const totalMembers = members.filter((m) => m.role !== "auditor").length;

		return {
			cycle,
			totalCollected,
			totalPenalties,
			paidCount,
			totalMembers,
			// Always show actual collected amount - this reflects current reality
			// Even for executed payouts, show what was actually collected (not the historical potTotal)
			payoutAmount: totalCollected,
		};
	});

	// Prepare chart data
	const chartData = cycleStats.map((stat) => ({
		month: `M${stat.cycle.cycleNumber}`,
		collected: stat.totalCollected,
		payout: stat.payoutAmount,
		penalties: stat.totalPenalties,
	}));

	// Overall statistics
	const totalCollected = cycleStats.reduce(
		(sum, s) => sum + s.totalCollected,
		0
	);
	const totalPayouts = cycleStats.reduce((sum, s) => sum + s.payoutAmount, 0);
	const totalPenalties = cycleStats.reduce(
		(sum, s) => sum + s.totalPenalties,
		0
	);
	const completedCycles = cycles.filter((c) => c.status === "completed").length;

	// Calculate member balances
	const memberBalances = members
		.filter((m) => m.role !== "auditor")
		.map((member) => {
			// Contributions paid by member
			const contributions = transactions
				.filter((t) => t.type === "contribution" && t.memberId === member.id)
				.reduce((sum, t) => sum + t.amount, 0);

			// Penalties paid by member
			const penalties = transactions
				.filter((t) => t.type === "penalty" && t.memberId === member.id)
				.reduce((sum, t) => sum + t.amount, 0);

			// Payouts received by member
			const payouts = transactions
				.filter((t) => t.type === "payout" && t.recipientId === member.id)
				.reduce((sum, t) => sum + t.amount, 0);

			const totalPaid = contributions + penalties;
			const netPosition = payouts - totalPaid;

			return {
				member,
				contributions,
				penalties,
				totalPaid,
				payouts,
				netPosition,
			};
		});

	// Sort transactions by date (newest first)
	const sortedTransactions = [...transactions].sort(
		(a, b) =>
			new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
	);

	// Get badge color for transaction type
	const getTypeBadge = (type: string) => {
		console.log("Transaction type:", type); // Debug log
		switch (type) {
			case "contribution":
				return (
					<Badge variant="default" className="bg-green-600 text-white">
						Contribution
					</Badge>
				);
			case "penalty":
				return <Badge variant="destructive">Penalty</Badge>;
			case "payout":
				return (
					<Badge variant="secondary" className="bg-blue-600 text-white">
						Payout
					</Badge>
				);
			default:
				return <Badge variant="outline">{type || "Unknown"}</Badge>;
		}
	};

	if (!group || !group.rules) {
		return (
			<div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
				No group ledger data available.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Group Overview */}
			<Card>
				<CardHeader>
					<CardTitle>{group.name}</CardTitle>
					<CardDescription>
						{group.groupSize} members • {group.currency}
						{group.monthlyContribution.toLocaleString()} per month
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Summary Stats */}
					<div className="grid grid-cols-4 gap-4">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Total Collected</p>
							<p className="text-2xl font-bold">
								{formatCurrency(totalCollected, group.currency)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Total Payouts</p>
							<p className="text-2xl font-bold text-green-600">
								{formatCurrency(totalPayouts, group.currency)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Total Penalties</p>
							<p className="text-2xl font-bold text-orange-600">
								{formatCurrency(totalPenalties, group.currency)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Completed Cycles</p>
							<p className="text-2xl font-bold">
								{completedCycles} / {group.duration}
							</p>
						</div>
					</div>

					{/* Group Details */}
					<div className="grid grid-cols-3 gap-4 pt-4 border-t">
						<div>
							<p className="text-sm text-muted-foreground">Start Date</p>
							<p className="font-medium">{formatDate(group.startMonth)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Payment Window</p>
							<p className="font-medium">
								Day {group.paymentWindow.startDay} -{" "}
								{group.paymentWindow.endDay}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Turn Order</p>
							<p className="font-medium capitalize">{group.turnOrderPolicy}</p>
						</div>
					</div>

					{/* Rules */}
					<div className="grid grid-cols-4 gap-4 pt-4 border-t">
						<div>
							<p className="text-sm text-muted-foreground">Grace Period</p>
							<p className="font-medium">{group.rules.gracePeriodDays} days</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Late Fee</p>
							<p className="font-medium">
								{formatCurrency(group.rules.lateFeePerDay, group.currency)}/day
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Max Late Fee</p>
							<p className="font-medium">
								{formatCurrency(group.rules.lateFeeMax, group.currency)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Quorum</p>
							<p className="font-medium">{group.rules.quorumPercentage}%</p>
						</div>
					</div>
				</CardContent>
			</Card>
			{/* Cashflow Chart */}
			<Card>
				<CardHeader>
					<CardTitle>Cashflow Timeline</CardTitle>
					<CardDescription>
						Monthly collections, payouts, and penalties
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
							<XAxis dataKey="month" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} />
							<Tooltip
								formatter={(value: number) =>
									formatCurrency(value, group.currency)
								}
								contentStyle={{
									backgroundColor: "white",
									border: "1px solid #ccc",
									borderRadius: "6px",
									color: "#000",
								}}
								cursor={{ fill: "rgba(200, 200, 200, 0.2)" }}
							/>
							<Legend iconType="square" wrapperStyle={{ color: "inherit" }} />
							<Bar
								dataKey="collected"
								fill={greenColors.collected}
								name="Collected"
							/>
							<Bar dataKey="payout" fill={greenColors.payout} name="Payout" />
							<Bar
								dataKey="penalties"
								fill={greenColors.penalties}
								name="Penalties"
							/>
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>{" "}
			{/* Cycle-wise Breakdown */}
			<Card>
				<CardHeader>
					<CardTitle>Cycle-wise Breakdown</CardTitle>
					<CardDescription>Detailed view of each monthly cycle</CardDescription>
				</CardHeader>

				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Cycle</TableHead>
								<TableHead>Month</TableHead>
								<TableHead>Paid / Total</TableHead>
								<TableHead>Collected</TableHead>
								<TableHead>Penalties</TableHead>
								<TableHead>Payout</TableHead>
								<TableHead>Recipient</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{cycleStats.map((stat) => {
								const recipient = members.find(
									(m) => m.id === stat.cycle.payoutRecipientId
								);

								return (
									<TableRow key={stat.cycle.id}>
										<TableCell>Month {stat.cycle.cycleNumber}</TableCell>
										<TableCell>{formatDate(stat.cycle.month)}</TableCell>
										<TableCell>
											{stat.paidCount} / {stat.totalMembers}
											<span className="text-muted-foreground ml-2">
												(
												{Math.round((stat.paidCount / stat.totalMembers) * 100)}
												%)
											</span>
										</TableCell>
										<TableCell>
											{formatCurrency(stat.totalCollected, group.currency)}
										</TableCell>
										<TableCell
											className={
												stat.totalPenalties > 0 ? "text-orange-600" : ""
											}
										>
											{stat.totalPenalties > 0
												? formatCurrency(stat.totalPenalties, group.currency)
												: "-"}
										</TableCell>
										<TableCell
											className={stat.payoutAmount > 0 ? "text-green-600" : ""}
										>
											{stat.payoutAmount > 0
												? formatCurrency(stat.payoutAmount, group.currency)
												: "-"}
										</TableCell>
										<TableCell>{recipient?.name || "-"}</TableCell>
										<TableCell>
											<Badge
												variant={
													stat.cycle.status === "completed"
														? "default"
														: stat.cycle.status === "active"
														? "secondary"
														: "outline"
												}
											>
												{stat.cycle.status}
											</Badge>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
			{/* Variance Analysis */}
			<Card>
				<CardHeader>
					<CardTitle>Variance Analysis</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{cycleStats.map((stat) => {
							const expectedCollection =
								stat.totalMembers * group.monthlyContribution;
							const variance = stat.totalCollected - expectedCollection;
							const variancePercentage = (variance / expectedCollection) * 100;

							if (variance === 0) return null;

							return (
								<div
									key={stat.cycle.id}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div>
										<p className="font-medium">
											Month {stat.cycle.cycleNumber}
										</p>
										<p className="text-sm text-muted-foreground">
											Expected:{" "}
											{formatCurrency(expectedCollection, group.currency)}
										</p>
									</div>
									<div className="text-right">
										<p
											className={
												variance >= 0 ? "text-green-600" : "text-red-600"
											}
										>
											{variance >= 0 ? "+" : ""}
											{formatCurrency(variance, group.currency)}
										</p>
										<p className="text-sm text-muted-foreground">
											{variancePercentage.toFixed(1)}%
										</p>
									</div>
								</div>
							);
						})}

						{cycleStats.every(
							(s) =>
								s.totalCollected === s.totalMembers * group.monthlyContribution
						) && (
							<p className="text-center text-muted-foreground py-8">
								No variances detected. All cycles collected the expected amount.
							</p>
						)}
					</div>
				</CardContent>
			</Card>
			{/* Member Balances Summary */}
			<Card>
				<CardHeader>
					<CardTitle>Member Balances</CardTitle>
					<CardDescription>
						Net position for each member (Received - Paid)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Member</TableHead>
								<TableHead className="text-right">Contributions</TableHead>
								<TableHead className="text-right">Penalties</TableHead>
								<TableHead className="text-right">Total Paid</TableHead>
								<TableHead className="text-right">Payouts Received</TableHead>
								<TableHead className="text-right">Net Position</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{memberBalances.map(
								({
									member,
									contributions,
									penalties,
									totalPaid,
									payouts,
									netPosition,
								}) => (
									<TableRow key={member.id}>
										<TableCell className="font-medium">{member.name}</TableCell>
										<TableCell className="text-right">
											{formatCurrency(contributions, group.currency)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(penalties, group.currency)}
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(totalPaid, group.currency)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(payouts, group.currency)}
										</TableCell>
										<TableCell
											className={`text-right font-bold ${
												netPosition >= 0 ? "text-green-600" : "text-red-600"
											}`}
										>
											{netPosition >= 0 ? "+" : ""}
											{formatCurrency(netPosition, group.currency)}
										</TableCell>
									</TableRow>
								)
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
			{/* Transaction History */}
			<Card>
				<CardHeader>
					<CardTitle>Transaction History</CardTitle>
					<CardDescription>
						Complete audit trail of all transactions
					</CardDescription>
				</CardHeader>
				<CardContent>
					{sortedTransactions.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">
							No transactions yet. Transactions will appear here when payments
							are approved and payouts are executed.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Member</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead>Reference</TableHead>
									<TableHead>Executed By</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedTransactions.map((tx) => {
									const member = members.find(
										(m) => m.id === tx.memberId || m.id === tx.recipientId
									);
									// Find admin by email in executedBy field
									// First check members
									let admin = members.find((m) => m.email === tx.executedBy);

									// If not found but executedBy matches group admin, use adminName prop
									let executedByName = admin?.name;
									if (
										!executedByName &&
										tx.executedBy === group.admin &&
										adminName
									) {
										executedByName = adminName;
									}
									// Fallback to email if still not found
									if (!executedByName) {
										executedByName = tx.executedBy;
									}

									return (
										<TableRow key={tx._id}>
											<TableCell>{formatDate(tx.executedAt)}</TableCell>
											<TableCell>{getTypeBadge(tx.type)}</TableCell>
											<TableCell>
												{tx.memberName || member?.name || "Unknown"}
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(tx.amount, group.currency)}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{tx.reference || "-"}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{executedByName}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
