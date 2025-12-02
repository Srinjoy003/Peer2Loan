import React, { useState, useEffect } from "react";
import MemberForm from "./components/member-form";
import MemberEditForm from "./components/member-edit-form";
import MemberDeleteForm from "./components/member-delete-form";
import CycleForm from "./components/cycle-form";
import CycleEditForm from "./components/cycle-edit-form";
import CycleDeleteForm from "./components/cycle-delete-form";
import PaymentForm from "./components/payment-form";
import PaymentEditForm from "./components/payment-edit-form";
import PaymentDeleteForm from "./components/payment-delete-form";
import { GroupSetup } from "./components/group-setup";
import AuthForm from "./components/AuthForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./components/ui/card";
import { CycleDashboard } from "./components/cycle-dashboard";
import { MemberLedger } from "./components/member-ledger";
import { GroupLedger } from "./components/group-ledger";
import { SummaryReport } from "./components/summary-report";
import { PaymentRecorder } from "./components/payment-recorder";
import { PaymentRequestForm } from "./components/payment-request-form";
import { TurnOrderTimeline } from "./components/turn-order-timeline";
import { NextPayoutCard } from "./components/next-payout-card";
// import { mockGroup, mockMembers, mockCycles, mockPayments } from './lib/mock-data';
import { Group, Member, Cycle, Payment } from "./types";
import { GroupDropdown } from "./components/group-dropdown";
import { formatCurrency } from "./lib/utils";
import { ThemeToggle } from "./components/theme-toggle";
import { NotificationsModal } from "./components/notifications-modal";
import { Toaster } from "./components/ui/sonner";
import { Badge } from "./components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./components/ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./components/ui/alert-dialog";
import {
	Users,
	Calendar,
	FileText,
	TrendingUp,
	Settings,
	PlusCircle,
	Bell,
} from "lucide-react";

export default function App() {
	const [showAddGroup, setShowAddGroup] = useState(false);
	const [selectedGroupId, setSelectedGroupId] = useState<string>("");
	const [showEditGroup, setShowEditGroup] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	async function fetchGroups() {
		try {
			const token = sessionStorage.getItem("token");
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			const groupRes = await fetch("/api/groups", { headers });
			if (!groupRes.ok) throw new Error("Failed to fetch groups");
			const groupData = await groupRes.json();

			// Set groups array
			setGroup(Array.isArray(groupData) ? groupData : []);

			if (Array.isArray(groupData) && groupData.length > 0) {
				setSelectedGroupId(groupData[0].id || groupData[0]._id);
			} else {
				setSelectedGroupId("");
			}
		} catch (err) {
			console.error("Error fetching groups:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}
	const [showAddCycle, setShowAddCycle] = useState(false);
	const [selectedCycle, setSelectedCycle] = useState(null);
	const [showEditCycle, setShowEditCycle] = useState(false);
	const [showAddPayment, setShowAddPayment] = useState(false);
	const [selectedPaymentObj, setSelectedPaymentObj] = useState(null);
	const [showEditPayment, setShowEditPayment] = useState(false);
	async function fetchCycles() {
		const token = sessionStorage.getItem("token");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		const cyclesRes = await fetch("/api/cycles", { headers });
		const cyclesData = await cyclesRes.json();
		// debug log removed
		setCycles(cyclesData);
	}

	async function fetchPayments() {
		const token = sessionStorage.getItem("token");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		const paymentsRes = await fetch("http://localhost:4000/api/payments", {
			headers,
			cache: "no-store", // Prevent caching to ensure fresh data
		});
		const paymentsData = await paymentsRes.json();
		console.log("💰 fetchPayments:", {
			count: paymentsData.length,
			payments: paymentsData.map((p: any) => ({
				id: p.id,
				cycleId: p.cycleId,
				memberId: p.memberId,
				status: p.status,
				amount: p.amount,
			})),
		});
		setPayments(paymentsData);
	}

	async function fetchTransactions() {
		if (!selectedGroupId) return;
		try {
			const token = sessionStorage.getItem("token");
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			const transactionsRes = await fetch(
				`http://localhost:4000/api/payments/transactions/${selectedGroupId}`,
				{ headers }
			);
			if (transactionsRes.ok) {
				const transactionsData = await transactionsRes.json();
				setTransactions(transactionsData);
			}
		} catch (err) {
			console.error("Error fetching transactions:", err);
		}
	}
	const [user, setUser] = useState(null);
	const [currentView, setCurrentView] = useState("dashboard");
	const [group, setGroup] = useState(null);
	const [members, setMembers] = useState([]);
	const [cycles, setCycles] = useState([]);
	const [payments, setPayments] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [selectedMember, setSelectedMember] = useState(null);
	const [showAddMember, setShowAddMember] = useState(false);
	const [showEditMember, setShowEditMember] = useState(false);
	const [paymentRecorderOpen, setPaymentRecorderOpen] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState(null);
	const [showMakePayment, setShowMakePayment] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [notificationCount, setNotificationCount] = useState(0);
	const [showPayoutConfirm, setShowPayoutConfirm] = useState(false);
	const [payoutDetails, setPayoutDetails] = useState<{
		recipient: Member | undefined;
		amount: number;
	} | null>(null);
	const [transactionId, setTransactionId] = useState("");

	// Restore user from sessionStorage on mount
	useEffect(() => {
		const savedUser = sessionStorage.getItem("user");
		if (savedUser) {
			try {
				setUser(JSON.parse(savedUser));
			} catch (err) {
				console.error("Failed to parse saved user:", err);
				sessionStorage.removeItem("user");
			}
		}
	}, []);

	// Fetch all data from backend on mount, only if user is logged in
	async function fetchMembers() {
		const token = sessionStorage.getItem("token");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		const membersRes = await fetch("/api/members", { headers });
		const membersData = await membersRes.json();
		setMembers(membersData);
	}

	async function fetchNotificationCount() {
		if (!user?.email) return;
		try {
			const token = sessionStorage.getItem("token");
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			const response = await fetch(
				`/api/invitations/my-invitations?email=${encodeURIComponent(
					user.email
				)}`,
				{
					headers,
				}
			);
			if (response.ok) {
				const invitations = await response.json();
				setNotificationCount(invitations.length);
			}
		} catch (err) {
			console.error("Failed to fetch notifications:", err);
		}
	}

	useEffect(() => {
		if (!user) return;
		async function fetchAll() {
			setLoading(true);
			setError("");
			try {
				const token = sessionStorage.getItem("token");
				const headers = token ? { Authorization: `Bearer ${token}` } : {};
				const [groupRes, membersRes, cyclesRes, paymentsRes] =
					await Promise.all([
						fetch("/api/groups", { headers }),
						fetch("/api/members", { headers }),
						fetch("/api/cycles", { headers }),
						fetch("http://localhost:4000/api/payments", { headers }),
					]);
				if (!groupRes.ok) throw new Error("Failed to fetch groups");
				if (!membersRes.ok) throw new Error("Failed to fetch members");
				if (!cyclesRes.ok) throw new Error("Failed to fetch cycles");
				if (!paymentsRes.ok) throw new Error("Failed to fetch payments");
				const groupData = await groupRes.json();
				const membersData = await membersRes.json();
				const cyclesData = await cyclesRes.json();
				const paymentsData = await paymentsRes.json();

				console.log("fetchAll - received groups:", groupData);
				console.log("fetchAll - received payments:", paymentsData);

				// Backend already filters groups, no need to filter again
				setGroup(Array.isArray(groupData) ? groupData : []);
				if (Array.isArray(groupData) && groupData.length > 0) {
					setSelectedGroupId(groupData[0].id || groupData[0]._id);
				} else {
					setSelectedGroupId("");
				}
				setMembers(membersData);
				setCycles(cyclesData);
				setPayments(paymentsData);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}
		fetchAll();
		fetchNotificationCount(); // Fetch notification count on mount
	}, [user]);

	// Fetch notification count periodically
	useEffect(() => {
		if (!user) return;

		const interval = setInterval(() => {
			fetchNotificationCount();
		}, 30000); // Check every 30 seconds

		return () => clearInterval(interval);
	}, [user]);

	// Poll for payment and cycle updates every 3 seconds (only when tab is visible)
	useEffect(() => {
		if (!user || !selectedGroupId) return;

		const pollInterval = setInterval(() => {
			// Only poll if tab is visible to save resources
			if (document.visibilityState === "visible") {
				fetchPayments();
				fetchCycles();
			}
		}, 3000); // Poll every 3 seconds

		return () => clearInterval(pollInterval);
	}, [user, selectedGroupId]);

	// Auto-select first member when group changes
	useEffect(() => {
		if (selectedGroupId) {
			const groupMembers = members.filter((m) => m.groupId === selectedGroupId);
			if (groupMembers.length > 0) {
				// If current selected member is not in this group, select the first member
				if (!selectedMember || selectedMember.groupId !== selectedGroupId) {
					setSelectedMember(groupMembers[0]);
				}
			} else {
				setSelectedMember(null);
			}
			// Fetch transactions when group changes
			fetchTransactions();
		} else {
			setSelectedMember(null);
		}
	}, [selectedGroupId, members]);

	const selectedGroup = Array.isArray(group)
		? group.find((g: Group) => (g.id || (g as any)._id) === selectedGroupId)
		: group;
	const currentCycle = cycles.find(
		(c) => c.status === "active" && c.groupId === selectedGroupId
	);
	const currentUser = members.find((m) => m.groupId === selectedGroupId);

	// Check if current user is admin of the selected group
	const isAdmin = selectedGroup?.admin === user?.email;

	const handleGroupCreated = (newGroup: Group) => {
		// After creating a group, fetch all groups from backend and set selected group
		fetchGroups();
		setSelectedGroupId(newGroup.id);
		setCurrentView("dashboard");
		alert(
			"Group created successfully! You can now add members and start the first cycle."
		);
	};

	const handleRecordPayment = (memberId: string) => {
		const payment = payments.find(
			(p) =>
				p.memberId === memberId &&
				p.cycleId === currentCycle?.id &&
				p.status !== "paid"
		);
		if (payment) {
			const member = members.find((m) => m.id === memberId);
			if (member) {
				setSelectedMember(member);
				setSelectedPayment(payment);
				setPaymentRecorderOpen(true);
			}
		}
	};

	const handlePaymentRecorded = (
		paymentId: string,
		proof: string,
		paidOn: string
	) => {
		setPayments((prev) =>
			prev.map((p) =>
				p.id === paymentId
					? {
							...p,
							status: "paid" as const,
							proof,
							paidOn,
							updatedAt: new Date().toISOString(),
					  }
					: p
			)
		);
	};

	const handleExecutePayout = async () => {
		if (!currentCycle) return;

		const recipient = members.find(
			(m) => m.id === currentCycle.payoutRecipientId
		);

		// Calculate pot total from paid payments
		const paidPayments = payments.filter(
			(p) => p.cycleId === currentCycle.id && p.status === "paid"
		);
		const potTotal = paidPayments.reduce(
			(sum, p) => sum + p.amount + (p.penalty || 0),
			0
		);

		// Show confirmation modal
		setPayoutDetails({ recipient, amount: potTotal });
		setShowPayoutConfirm(true);
	};

	const confirmExecutePayout = async () => {
		if (!currentCycle || !payoutDetails || !selectedGroup) return;

		try {
			const token = sessionStorage.getItem("token");
		const response = await fetch(
			`http://localhost:4000/api/cycles/${currentCycle.id}/execute-payout`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					groupId: selectedGroup.id || (selectedGroup as any)._id,
					transactionId: transactionId || `AUTO-${Date.now()}`,
				}),
			}
		);			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to execute payout");
			}

			const result = await response.json();

			// Update local state
			setCycles((prev) =>
				prev.map((c) =>
					c.id === currentCycle.id
						? {
								...c,
								payoutExecuted: true,
								payoutExecutedAt: result.executedAt,
								potTotal: result.potTotal,
								status: "completed" as const,
						  }
						: c
				)
			);

			// Close modal
			setShowPayoutConfirm(false);
			setPayoutDetails(null);
			setTransactionId("");

			alert(
				`✅ Payout executed successfully!\n\nAmount: ${formatCurrency(
					result.potTotal,
					group.currency
				)}\nRecipient: ${payoutDetails.recipient?.name}`
			);

			// Refresh cycles to get updated data
			await fetchCycles();
		} catch (error: any) {
			console.error("Error executing payout:", error);
			alert(`❌ Failed to execute payout: ${error.message}`);
			setShowPayoutConfirm(false);
			setPayoutDetails(null);
			setTransactionId("");
		}
	};

	function handleLogout() {
		setUser(null);
		sessionStorage.removeItem("token");
		sessionStorage.removeItem("user");
	}

	if (currentView === "setup") {
		return (
			<GroupSetup
				onGroupCreated={handleGroupCreated}
				onCancel={() => setCurrentView("dashboard")}
				userEmail={user?.email}
			/>
		);
	}

	if (!user) {
		return <AuthForm onAuth={setUser} />;
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				Loading...
			</div>
		);
	}
	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center text-red-600">
				Error: {error}
			</div>
		);
	}
	// Always render dashboard UI, show empty states if no group

	const showEmpty = !selectedGroup;

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b bg-card sticky top-0 z-10">
				<div className="container mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1>Peer2Loan</h1>
							<div className="flex items-center gap-2">
								{Array.isArray(group) && group.length > 0 ? (
									<GroupDropdown
										groups={group}
										selectedGroupId={selectedGroupId}
										onSelectGroup={setSelectedGroupId}
									/>
								) : (
									<p className="text-muted-foreground">
										No groups yet. Create one to get started!
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-4">
							<ThemeToggle />
							<div className="relative inline-block">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setShowNotifications(true);
										fetchNotificationCount(); // Refresh count when opening
									}}
								>
									<Bell className="w-4 h-4 mr-2" />
									Notifications
								</Button>
								{notificationCount > 0 && (
									<span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
								)}
							</div>
							<div className="text-right">
								<p className="text-muted-foreground">Logged in as</p>
								<p>{user?.name}</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="gap-2"
							>
								Logout
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentView("setup")}
								className="gap-2"
							>
								<PlusCircle className="w-4 h-4" />
								Create New Group
							</Button>
						</div>
					</div>
				</div>
			</header>
			{/* Main Content */}
			<main className="container mx-auto px-6 py-8">
				<Tabs defaultValue="current" className="space-y-6">
					<TabsList className="grid w-full grid-cols-6">
						<TabsTrigger value="current" className="gap-2">
							<Calendar className="w-4 h-4" />
							Current Cycle
						</TabsTrigger>
						<TabsTrigger value="timeline" className="gap-2">
							<TrendingUp className="w-4 h-4" />
							Timeline
						</TabsTrigger>
						<TabsTrigger value="members" className="gap-2">
							<Users className="w-4 h-4" />
							Members
						</TabsTrigger>
						<TabsTrigger value="group" className="gap-2">
							<Settings className="w-4 h-4" />
							Group Ledger
						</TabsTrigger>
						<TabsTrigger value="reports" className="gap-2">
							<FileText className="w-4 h-4" />
							Reports
						</TabsTrigger>
						<TabsTrigger value="my-ledger" className="gap-2">
							<Users className="w-4 h-4" />
							My Ledger
						</TabsTrigger>
					</TabsList>
					<TabsContent value="current">
						{showEmpty ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-muted-foreground">
										You are not part of any group.
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-4">
								<NextPayoutCard
									cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
									members={members.filter((m) => m.groupId === selectedGroupId)}
									group={selectedGroup}
								/>
								{isAdmin && (
									<div className="flex justify-end gap-2 overflow-visible">
										<Button
											onClick={() => setShowAddCycle(true)}
											disabled={(() => {
											const contributingMembers = members.filter(
												(m) => m.groupId === selectedGroupId && m.role !== "auditor"
											);
											const groupCycles = cycles.filter((c) => c.groupId === selectedGroupId);
											return !!currentCycle || groupCycles.length >= contributingMembers.length;
										})()}
										>
											<PlusCircle className="w-4 h-4 mr-2" />
											Add New Cycle
										</Button>
										<Button
											onClick={() => {
												// Find first pending approval payment to open verification modal
												const pendingPayment = payments.find(
													(p) =>
														p.groupId === selectedGroupId &&
														p.cycleId === currentCycle?.id &&
														p.status === "pending_approval"
												);

												// Always open modal, even if no pending payments
												if (pendingPayment) {
													const member = members.find(
														(m) => m.id === pendingPayment.memberId
													);
													if (member) {
														setSelectedMember(member);
														setSelectedPayment(pendingPayment);
													}
												} else {
													// Set dummy member and payment to open modal
													const firstMember = members.find(
														(m) => m.groupId === selectedGroupId
													);
													const dummyPayment = {
														id: "dummy",
														memberId: firstMember?.id || "",
														cycleId: currentCycle?.id || "",
														groupId: selectedGroupId,
														amount: 0,
														status: "pending" as const,
														penalty: 0,
													};
													setSelectedMember(firstMember || null);
													setSelectedPayment(dummyPayment as any);
												}
												setPaymentRecorderOpen(true);
											}}
										>
											<PlusCircle className="w-4 h-4 mr-2" />
											Verify Payments
										</Button>
										{payments.filter(
											(p) =>
												p.groupId === selectedGroupId &&
												p.cycleId === currentCycle?.id &&
												p.status === "pending_approval"
										).length > 0 && (
											<span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
										)}
									</div>
								)}
								<CycleDashboard
									cycle={currentCycle}
									payments={payments.filter(
										(p) => p.groupId === selectedGroupId
									)}
									members={members.filter((m) => m.groupId === selectedGroupId)}
									group={selectedGroup}
									isAdmin={isAdmin}
									currentUserEmail={user?.email || ""}
									onRecordPayment={handleRecordPayment}
									onExecutePayout={handleExecutePayout}
									onMakePayment={() => setShowMakePayment(true)}
									onPaymentsUpdated={fetchPayments}
								/>
							</div>
						)}
					</TabsContent>
					<TabsContent value="timeline">
						{showEmpty || cycles.length === 0 ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-muted-foreground">
										{showEmpty
											? "You are not part of any group."
											: "No timeline data yet."}
									</p>
									{!showEmpty && isAdmin && (() => {
										const contributingMembers = members.filter(
											(m) => m.groupId === selectedGroupId && m.role !== "auditor"
										);
										const groupCycles = cycles.filter((c) => c.groupId === selectedGroupId);
										const maxCyclesReached = groupCycles.length >= contributingMembers.length;
										return (
											<Button
												onClick={() => setShowAddCycle(true)}
												className="mt-4"
												disabled={maxCyclesReached}
											>
												<PlusCircle className="w-4 h-4 mr-2" />
												Add First Cycle
											</Button>
										);
									})()}
								</CardContent>
							</Card>
						) : (
							<div className="space-y-4">
								<div className="flex justify-end">
									<Button
										onClick={() => setShowAddCycle(true)}
										disabled={(() => {
											const contributingMembers = members.filter(
												(m) => m.groupId === selectedGroupId && m.role !== "auditor"
											);
											const groupCycles = cycles.filter((c) => c.groupId === selectedGroupId);
											return !!currentCycle || groupCycles.length >= contributingMembers.length;
										})()}
									>
										<PlusCircle className="w-4 h-4 mr-2" />
										Add New Cycle
									</Button>
								</div>
								<TurnOrderTimeline
									group={selectedGroup}
									members={members.filter((m) => m.groupId === selectedGroupId)}
									cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
								/>
							</div>
						)}
					</TabsContent>
					<TabsContent value="members">
						{showEmpty ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-muted-foreground">
										You are not part of any group.
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-4">
								{members.filter((m) => m.groupId === selectedGroupId).length >
								0 ? (
									<>
										<div className="flex justify-between items-center gap-2">
											<Select
												value={selectedMember?.id || selectedMember?._id || ""}
												onValueChange={(memberId) => {
													const member = members.find(
														(m) =>
															(m.id || m._id) === memberId &&
															m.groupId === selectedGroupId
													);
													setSelectedMember(member || null);
												}}
											>
												<SelectTrigger className="w-[300px]">
													<SelectValue placeholder="Select a member" />
												</SelectTrigger>
												<SelectContent>
													{members
														.filter((m) => m.groupId === selectedGroupId)
														.map((member) => (
															<SelectItem
																key={member.id || member._id}
																value={member.id || member._id}
															>
																{member.name} - {member.email}
															</SelectItem>
														))}
												</SelectContent>
											</Select>
											{isAdmin && (
												<Button onClick={() => setShowAddMember(true)}>
													<PlusCircle className="w-4 h-4 mr-2" />
													Add Member
												</Button>
											)}
										</div>

										{selectedMember ? (
											<MemberLedger
												member={selectedMember}
												payments={payments.filter(
													(p) => p.groupId === selectedGroupId
												)}
												cycles={cycles.filter(
													(c) => c.groupId === selectedGroupId
												)}
												group={selectedGroup}
											/>
										) : (
											<Card>
												<CardContent className="p-6">
													<p className="text-muted-foreground">
														Select a member to view their details.
													</p>
												</CardContent>
											</Card>
										)}
									</>
								) : (
									<>
										{isAdmin && (
											<div className="flex justify-end">
												<Button onClick={() => setShowAddMember(true)}>
													<PlusCircle className="w-4 h-4 mr-2" />
													Add Member
												</Button>
											</div>
										)}
										<Card>
											<CardContent className="p-6">
												<p className="text-muted-foreground">
													No members added yet.
													{isAdmin && ' Click "Add Member" to get started.'}
												</p>
											</CardContent>
										</Card>
									</>
								)}
							</div>
						)}
					</TabsContent>
					<TabsContent value="group">
						{showEmpty ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-muted-foreground">
										You are not part of any group.
									</p>
								</CardContent>
							</Card>
						) : (
							<GroupLedger
								group={selectedGroup}
								cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
								payments={payments.filter((p) => p.groupId === selectedGroupId)}
								members={members.filter((m) => m.groupId === selectedGroupId)}
								transactions={transactions}
								adminName={user?.name || user?.email}
							/>
						)}
					</TabsContent>
					<TabsContent value="reports">
						{showEmpty ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-muted-foreground">
										You are not part of any group.
									</p>
								</CardContent>
							</Card>
						) : (
							<SummaryReport
								group={selectedGroup}
								cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
								payments={payments.filter((p) => p.groupId === selectedGroupId)}
								members={members.filter((m) => m.groupId === selectedGroupId)}
								transactions={transactions}
							/>
						)}
					</TabsContent>
					<TabsContent value="my-ledger">
						{showEmpty ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-muted-foreground">
										You are not part of any group.
									</p>
								</CardContent>
							</Card>
						) : (
							(() => {
								const currentUserMember = members.find(
									(m) =>
										m.email === user?.email && m.groupId === selectedGroupId
								);
								return currentUserMember ? (
									<MemberLedger
										member={currentUserMember}
										payments={payments.filter(
											(p) => p.groupId === selectedGroupId
										)}
										cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
										group={selectedGroup}
									/>
								) : (
									<Card>
										<CardContent className="p-6">
											<p className="text-muted-foreground">
												You are not a member of this group.
											</p>
										</CardContent>
									</Card>
								);
							})()
						)}
					</TabsContent>
				</Tabs>
			</main>
			{/* Modals for Adding Data */}
			{showAddMember && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-background rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
						<MemberForm
							groupId={selectedGroupId}
							onSuccess={() => {
								setShowAddMember(false);
								fetchMembers();
								fetchPayments(); // Refresh payments as well since a payment record is created for active cycles
							}}
							onCancel={() => setShowAddMember(false)}
						/>
					</div>
				</div>
			)}
			{showAddCycle && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-background rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-y-auto">
						<CycleForm
							groupId={selectedGroupId}
							group={group}
							cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
							members={members.filter((m) => m.groupId === selectedGroupId)}
							onSuccess={() => {
								setShowAddCycle(false);
								fetchCycles();
							}}
							onCancel={() => setShowAddCycle(false)}
						/>
					</div>
				</div>
			)}{" "}
			{showAddPayment && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-background rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
						<PaymentForm
							groupId={selectedGroupId}
							onSuccess={() => {
								setShowAddPayment(false);
								fetchPayments();
							}}
							onCancel={() => setShowAddPayment(false)}
						/>
					</div>
				</div>
			)}
			{showEditMember && selectedMember && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
					<div className="bg-card rounded-lg shadow-lg p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
						<h2 className="text-2xl font-bold mb-4">Edit Member</h2>
						<MemberEditForm
							member={selectedMember}
							onSuccess={() => {
								setShowEditMember(false);
								setSelectedMember(null);
								fetchMembers();
							}}
						/>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => {
								setShowEditMember(false);
								setSelectedMember(null);
							}}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
			{showEditCycle && selectedCycle && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
					<div className="bg-card rounded-lg shadow-lg p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
						<h2 className="text-2xl font-bold mb-4">Edit Cycle</h2>
						<CycleEditForm
							cycle={selectedCycle}
							onSuccess={() => {
								setShowEditCycle(false);
								setSelectedCycle(null);
								fetchCycles();
							}}
						/>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => {
								setShowEditCycle(false);
								setSelectedCycle(null);
							}}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
			{showEditPayment && selectedPaymentObj && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
					<div className="bg-card rounded-lg shadow-lg p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
						<h2 className="text-2xl font-bold mb-4">Edit Payment</h2>
						<PaymentEditForm
							payment={selectedPaymentObj}
							onSuccess={() => {
								setShowEditPayment(false);
								setSelectedPaymentObj(null);
								fetchPayments();
							}}
						/>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => {
								setShowEditPayment(false);
								setSelectedPaymentObj(null);
							}}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
			{/* Show GroupSetup modal if currentView is setup */}
			{currentView === "setup" && user && user.email && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg p-8">
						<GroupSetup
							onGroupCreated={handleGroupCreated}
							userEmail={user.email}
						/>
						<Button
							className="mt-4"
							onClick={() => setCurrentView("dashboard")}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
			{/* Notifications Modal */}
			{showNotifications && user && user.email && (
				<NotificationsModal
					userEmail={user.email}
					onClose={() => {
						setShowNotifications(false);
						fetchNotificationCount(); // Refresh count when closing
					}}
					onInvitationProcessed={() => {
						fetchMembers(); // Refresh members list when invitation is accepted
						fetchNotificationCount(); // Refresh notification count
					}}
				/>
			)}
			{/* Payment Recorder Modal (Admin) */}
			{paymentRecorderOpen &&
				selectedMember &&
				selectedPayment &&
				currentCycle && (
					<PaymentRecorder
						open={paymentRecorderOpen}
						onClose={() => {
							setPaymentRecorderOpen(false);
							setSelectedMember(null);
							setSelectedPayment(null);
						}}
						member={selectedMember}
						payment={selectedPayment}
						group={selectedGroup}
						cycleId={currentCycle.id}
						members={members.filter((m) => m.groupId === selectedGroupId)}
						payments={payments.filter((p) => p.groupId === selectedGroupId)}
						onPaymentRecorded={handlePaymentRecorded}
						onPaymentsUpdated={fetchPayments}
					/>
				)}
			{/* Make Payment Modal (Non-Admin Members) */}
			{showMakePayment && currentCycle && user && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
						<PaymentRequestForm
							cycleId={currentCycle.id}
							memberId={
								members.find(
									(m) => m.email === user.email && m.groupId === selectedGroupId
								)?.id || ""
							}
							memberName={
								members.find(
									(m) => m.email === user.email && m.groupId === selectedGroupId
								)?.name || user.email
							}
							expectedAmount={selectedGroup?.monthlyContribution || 0}
							currency={selectedGroup?.currency || "USD"}
							onSuccess={async () => {
								// Force refresh all data to show updated status
								await fetchPayments();
								await fetchCycles();
								fetchNotificationCount(); // Refresh notification count for admin
								setShowMakePayment(false);
							}}
							onCancel={() => setShowMakePayment(false)}
						/>
					</div>
				</div>
			)}
			{/* Execute Payout Confirmation Modal */}
			<AlertDialog open={showPayoutConfirm} onOpenChange={setShowPayoutConfirm}>
				<AlertDialogContent className="p-6">
					<AlertDialogHeader className="mb-4">
						<AlertDialogTitle>Confirm Payout Execution</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. Please verify the details below.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-8 py-8 px-4">
						<div className="flex justify-between items-center gap-8">
							<p className="text-sm font-medium text-muted-foreground">
								Recipient:
							</p>
							<p className="text-lg font-bold">
								{payoutDetails?.recipient?.name}
							</p>
						</div>
						<div className="flex justify-between items-center gap-8">
							<p className="text-sm font-medium text-muted-foreground">
								Amount:
							</p>
							<p className="text-2xl font-bold text-green-600">
								{formatCurrency(
									payoutDetails?.amount || 0,
									selectedGroup?.currency || "INR"
								)}
							</p>
						</div>
						<div className="space-y-2">
							<label htmlFor="transactionId" className="text-sm font-medium">
								Transaction ID <span className="text-red-500">*</span>
							</label>
							<input
								id="transactionId"
								type="text"
								value={transactionId}
								onChange={(e) => setTransactionId(e.target.value)}
								placeholder="Enter transaction/reference ID"
								className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
								required
							/>
							<p className="text-xs text-muted-foreground">
								Enter the payment transaction ID or reference number
							</p>
						</div>
					</div>
					<AlertDialogFooter className="mt-4 gap-3">
						<AlertDialogCancel
							onClick={() => {
								setShowPayoutConfirm(false);
								setPayoutDetails(null);
								setTransactionId("");
							}}
							className="h-9"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={confirmExecutePayout} className="h-9">
							Confirm Payout
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<Toaster />
		</div>
	);
}
