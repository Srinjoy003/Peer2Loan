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
import { TurnOrderTimeline } from "./components/turn-order-timeline";
// import { mockGroup, mockMembers, mockCycles, mockPayments } from './lib/mock-data';
import { Group, Member, Cycle, Payment } from "./types";
import { GroupDropdown } from "./components/group-dropdown";
import { formatCurrency } from "./lib/utils";
import {
	Users,
	Calendar,
	FileText,
	TrendingUp,
	Settings,
	PlusCircle,
} from "lucide-react";

export default function App() {
	const [showAddGroup, setShowAddGroup] = useState(false);
	const [selectedGroupId, setSelectedGroupId] = useState<string>("");
	const [showEditGroup, setShowEditGroup] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	async function fetchGroups() {
		try {
			const token = localStorage.getItem("token");
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			const groupRes = await fetch("/api/groups", { headers });
			if (!groupRes.ok) throw new Error("Failed to fetch groups");
			const groupData = await groupRes.json();
			setGroup(groupData);
			if (Array.isArray(groupData) && groupData.length > 0) {
				setSelectedGroupId(groupData[0].id);
			}
		} catch (err) {
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
		const token = localStorage.getItem("token");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		const cyclesRes = await fetch("/api/cycles", { headers });
		const cyclesData = await cyclesRes.json();
		setCycles(cyclesData);
	}

	async function fetchPayments() {
		const token = localStorage.getItem("token");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		const paymentsRes = await fetch("/api/payments", { headers });
		const paymentsData = await paymentsRes.json();
		setPayments(paymentsData);
	}
	const [user, setUser] = useState(null);
	const [currentView, setCurrentView] = useState("dashboard");
	const [group, setGroup] = useState(null);
	const [members, setMembers] = useState([]);
	const [cycles, setCycles] = useState([]);
	const [payments, setPayments] = useState([]);
	const [selectedMember, setSelectedMember] = useState(null);
	const [showAddMember, setShowAddMember] = useState(false);
	const [showEditMember, setShowEditMember] = useState(false);
	const [paymentRecorderOpen, setPaymentRecorderOpen] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState(null);

	// Fetch all data from backend on mount, only if user is logged in
	async function fetchMembers() {
		const token = localStorage.getItem("token");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		const membersRes = await fetch("/api/members", { headers });
		const membersData = await membersRes.json();
		setMembers(membersData);
	}

	useEffect(() => {
		if (!user) return;
		async function fetchAll() {
			setLoading(true);
			setError("");
			try {
				const token = localStorage.getItem("token");
				const headers = token ? { Authorization: `Bearer ${token}` } : {};
				const [groupRes, membersRes, cyclesRes] = await Promise.all([
					fetch("/api/groups", { headers }),
					fetch("/api/members", { headers }),
					fetch("/api/cycles", { headers }),
				]);
				if (!groupRes.ok) throw new Error("Failed to fetch groups");
				if (!membersRes.ok) throw new Error("Failed to fetch members");
				if (!cyclesRes.ok) throw new Error("Failed to fetch cycles");
				const groupData = await groupRes.json();
				const membersData = await membersRes.json();
				const cyclesData = await cyclesRes.json();
				setGroup(Array.isArray(groupData) ? groupData[0] || null : groupData);
				if (Array.isArray(groupData) && groupData.length > 0) {
					setSelectedGroupId(groupData[0].id);
				}
				setMembers(membersData);
				setCycles(cyclesData);
				// Flatten all contributions from cycles into a payments array
				const allPayments = cyclesData.flatMap((cycle: any) =>
					(cycle.contributions || []).map((contribution: any) => ({
						...contribution,
						cycleId: cycle.id,
						status: contribution.hasPaid ? "paid" : "pending",
						amount: groupData?.monthlyAmount,
					}))
				);
				setPayments(allPayments);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}
		fetchAll();
	}, [user]);

	const selectedGroup = Array.isArray(group)
		? group.find((g: Group) => g.id === selectedGroupId)
		: group;
	const currentCycle = cycles.find(
		(c) => c.status === "active" && c.groupId === selectedGroupId
	);
	const currentUser = members.find((m) => m.groupId === selectedGroupId);

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

	const handleExecutePayout = () => {
		if (!currentCycle) return;

		const confirmed = window.confirm(
			`Execute payout of ${formatCurrency(
				currentCycle.potTotal,
				group.currency
			)} to ${
				members.find((m) => m.id === currentCycle.payoutRecipientId)?.name
			}?`
		);

		if (confirmed) {
			setCycles((prev) =>
				prev.map((c) =>
					c.id === currentCycle.id
						? {
								...c,
								payoutExecuted: true,
								payoutExecutedAt: new Date().toISOString(),
								payoutProof: `TXN-${Date.now()}`,
								status: "completed" as const,
						  }
						: c
				)
			);
			alert("Payout executed successfully!");
		}
	};

	function handleLogout() {
		setUser(null);
		localStorage.removeItem("token");
	}

	if (currentView === "setup") {
		return (
			<GroupSetup
				onGroupCreated={handleGroupCreated}
				onCancel={() => setCurrentView("dashboard")}
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
								<GroupDropdown
									groups={Array.isArray(group) ? group : group ? [group] : []}
									selectedGroupId={selectedGroupId}
									onSelectGroup={setSelectedGroupId}
								/>
								<p className="text-muted-foreground">
									{selectedGroup ? selectedGroup.name : "No group yet"}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
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
					</TabsList>
					<TabsContent value="current">
						{showEmpty ? (
							<Card>
								<CardContent>No group or cycle data yet.</CardContent>
							</Card>
						) : (
							<CycleDashboard
								cycle={currentCycle}
								payments={payments.filter((p) => p.groupId === selectedGroupId)}
								members={members.filter((m) => m.groupId === selectedGroupId)}
								group={selectedGroup}
								onRecordPayment={handleRecordPayment}
								onExecutePayout={handleExecutePayout}
							/>
						)}
					</TabsContent>
					<TabsContent value="timeline">
						{showEmpty || cycles.length === 0 ? (
							<Card>
								<CardContent>No timeline data yet.</CardContent>
							</Card>
						) : (
							<TurnOrderTimeline
								group={selectedGroup}
								members={members.filter((m) => m.groupId === selectedGroupId)}
								cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
							/>
						)}
					</TabsContent>
					<TabsContent value="members">
						{showEmpty ? (
							<Card>
								<CardContent>No members yet.</CardContent>
							</Card>
						) : (
							<MemberLedger
								member={members.filter((m) => m.groupId === selectedGroupId)[0]}
								payments={payments.filter((p) => p.groupId === selectedGroupId)}
								cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
								group={selectedGroup}
							/>
						)}
					</TabsContent>
					<TabsContent value="group">
						{showEmpty ? (
							<Card>
								<CardContent>No group ledger data yet.</CardContent>
							</Card>
						) : (
							<GroupLedger
								group={selectedGroup}
								cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
								payments={payments.filter((p) => p.groupId === selectedGroupId)}
								members={members.filter((m) => m.groupId === selectedGroupId)}
							/>
						)}
					</TabsContent>
					<TabsContent value="reports">
						{showEmpty ? (
							<Card>
								<CardContent>No reports yet.</CardContent>
							</Card>
						) : (
							<SummaryReport
								group={selectedGroup}
								cycles={cycles.filter((c) => c.groupId === selectedGroupId)}
								payments={payments.filter((p) => p.groupId === selectedGroupId)}
								members={members.filter((m) => m.groupId === selectedGroupId)}
							/>
						)}
					</TabsContent>
				</Tabs>
			</main>
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
		</div>
	);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b bg-card sticky top-0 z-10">
				<div className="container mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1>Peer2Loan</h1>
							<p className="text-muted-foreground">{group.name}</p>
						</div>
						<div className="flex items-center gap-4">
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
								New Group
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
							My Ledger
						</TabsTrigger>
					</TabsList>

					{/* Current Cycle Tab */}
					<TabsContent value="current" className="space-y-6">
						<div className="flex gap-2 mb-4">
							<Button onClick={() => setShowAddCycle(true)}>Add Cycle</Button>
						</div>
						{showAddCycle && (
							<CycleForm
								onSuccess={() => {
									setShowAddCycle(false);
									fetchCycles();
								}}
							/>
						)}
						<div className="grid grid-cols-2 gap-4 mb-4">
							{cycles.map((cycle) => (
								<Card
									key={cycle._id || cycle.id}
									className="cursor-pointer hover:bg-accent/50 transition-colors"
									onClick={() => {
										setSelectedCycle(cycle);
										setShowEditCycle(false);
									}}
								>
									<CardHeader>
										<CardTitle>Cycle {cycle.cycleNumber}</CardTitle>
										<CardDescription>{cycle.groupId}</CardDescription>
									</CardHeader>
								</Card>
							))}
						</div>
						{selectedCycle && (
							<div className="space-y-4 mt-4">
								<div className="flex gap-2">
									<Button onClick={() => setShowEditCycle(true)}>Edit</Button>
									<Button
										variant="destructive"
										onClick={() => setShowEditCycle(false)}
									>
										Cancel Edit
									</Button>
								</div>
								{showEditCycle && (
									<CycleEditForm
										cycle={selectedCycle}
										onSuccess={() => {
											setShowEditCycle(false);
											setSelectedCycle(null);
											fetchCycles();
										}}
									/>
								)}
								<CycleDeleteForm
									cycleId={selectedCycle._id || selectedCycle.id}
									onSuccess={() => {
										setSelectedCycle(null);
										fetchCycles();
									}}
								/>
							</div>
						)}
						{currentCycle ? (
							<CycleDashboard
								cycle={currentCycle}
								payments={payments}
								members={members}
								group={group}
								onRecordPayment={handleRecordPayment}
								onExecutePayout={handleExecutePayout}
							/>
						) : (
							<Card>
								<CardHeader>
									<CardTitle>No Active Cycle</CardTitle>
									<CardDescription>
										All cycles completed or not yet started
									</CardDescription>
								</CardHeader>
							</Card>
						)}
					</TabsContent>

					{/* Timeline Tab */}
					<TabsContent value="timeline">
						<TurnOrderTimeline
							cycles={cycles}
							members={members}
							group={group}
						/>
					</TabsContent>

					{/* Members Tab */}
					<TabsContent value="members" className="space-y-6">
						<div className="flex gap-2 mb-4">
							<Button onClick={() => setShowAddMember(true)}>Add Member</Button>
						</div>
						{showAddMember && (
							<MemberForm
								onSuccess={() => {
									setShowAddMember(false);
									fetchMembers();
								}}
							/>
						)}
						<Card>
							<CardHeader>
								<CardTitle>All Members</CardTitle>
								<CardDescription>
									Select a member to view, edit, or delete
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4">
									{members.map((member) => (
										<Card
											key={member._id || member.id}
											className="cursor-pointer hover:bg-accent/50 transition-colors"
											onClick={() => {
												setSelectedMember(member);
												setShowEditMember(false);
											}}
										>
											<CardHeader>
												<div className="flex items-start justify-between">
													<div>
														<CardTitle>{member.name}</CardTitle>
														<CardDescription>{member.email}</CardDescription>
													</div>
													<span className="capitalize text-muted-foreground">
														{member.role}
													</span>
												</div>
											</CardHeader>
										</Card>
									))}
								</div>
							</CardContent>
						</Card>

						{selectedMember && (
							<div className="space-y-4 mt-4">
								<MemberLedger
									member={selectedMember}
									payments={payments}
									cycles={cycles}
									group={group}
								/>
								<div className="flex gap-2">
									<Button onClick={() => setShowEditMember(true)}>Edit</Button>
									<Button
										variant="destructive"
										onClick={() => setShowEditMember(false)}
									>
										Cancel Edit
									</Button>
								</div>
								{showEditMember && (
									<MemberEditForm
										member={selectedMember}
										onSuccess={() => {
											setShowEditMember(false);
											setSelectedMember(null);
											fetchMembers();
										}}
									/>
								)}
								<MemberDeleteForm
									memberId={selectedMember._id || selectedMember.id}
									onSuccess={() => {
										setSelectedMember(null);
										fetchMembers();
									}}
								/>
							</div>
						)}
					</TabsContent>

					{/* Payments Tab */}
					<TabsContent value="payments" className="space-y-6">
						<div className="flex gap-2 mb-4">
							<Button onClick={() => setShowAddPayment(true)}>
								Add Payment
							</Button>
						</div>
						{showAddPayment && (
							<PaymentForm
								onSuccess={() => {
									setShowAddPayment(false);
									fetchPayments();
								}}
							/>
						)}
						<div className="grid grid-cols-2 gap-4 mb-4">
							{payments.map((payment) => (
								<Card
									key={payment._id || payment.id}
									className="cursor-pointer hover:bg-accent/50 transition-colors"
									onClick={() => {
										setSelectedPaymentObj(payment);
										setShowEditPayment(false);
									}}
								>
									<CardHeader>
										<CardTitle>Payment {payment.amount}</CardTitle>
										<CardDescription>{payment.memberId}</CardDescription>
									</CardHeader>
								</Card>
							))}
						</div>
						{selectedPaymentObj && (
							<div className="space-y-4 mt-4">
								<div className="flex gap-2">
									<Button onClick={() => setShowEditPayment(true)}>Edit</Button>
									<Button
										variant="destructive"
										onClick={() => setShowEditPayment(false)}
									>
										Cancel Edit
									</Button>
								</div>
								{showEditPayment && (
									<PaymentEditForm
										payment={selectedPaymentObj}
										onSuccess={() => {
											setShowEditPayment(false);
											setSelectedPaymentObj(null);
											fetchPayments();
										}}
									/>
								)}
								<PaymentDeleteForm
									paymentId={selectedPaymentObj._id || selectedPaymentObj.id}
									onSuccess={() => {
										setSelectedPaymentObj(null);
										fetchPayments();
									}}
								/>
							</div>
						)}
					</TabsContent>
					{/* Group Tab */}
					<TabsContent value="group" className="space-y-6">
						<div className="flex gap-2 mb-4">
							<Button onClick={() => setShowAddGroup(true)}>Add Group</Button>
						</div>
						{showAddGroup && (
							<GroupSetup
								onGroupCreated={() => {
									setShowAddGroup(false);
									fetchGroups();
								}}
							/>
						)}
						<Card>
							<CardHeader>
								<CardTitle>Group Details</CardTitle>
								<CardDescription>
									Select group to view, edit, or delete
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-4">
									<Card
										key={group?._id || group?.id}
										className="cursor-pointer hover:bg-accent/50 transition-colors"
										onClick={() => {
											setSelectedGroupId(group.id);
											setShowEditGroup(false);
										}}
									>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div>
													<CardTitle>{group?.name}</CardTitle>
													<CardDescription>
														{group?.description}
													</CardDescription>
												</div>
												<span className="capitalize text-muted-foreground">
													{group?.currency}
												</span>
											</div>
										</CardHeader>
									</Card>
								</div>
							</CardContent>
						</Card>

						{selectedGroup && (
							<div className="space-y-4 mt-4">
								<div className="flex gap-2">
									<Button onClick={() => setShowEditGroup(true)}>Edit</Button>
									<Button
										variant="destructive"
										onClick={() => setShowEditGroup(false)}
									>
										Cancel Edit
									</Button>
								</div>
								{/* If you have a GroupEditForm, render it here */}
								{/* {showEditGroup && (
									<GroupEditForm
										group={selectedGroup}
										onSuccess={() => {
											setShowEditGroup(false);
											setSelectedGroup(null);
											fetchGroups();
										}}
									/>
								)} */}
								{/* If you have a GroupDeleteForm, render it here */}
								{/* <GroupDeleteForm
									groupId={selectedGroup._id || selectedGroup.id}
									onSuccess={() => {
										setSelectedGroup(null);
										fetchGroups();
									}}
								/> */}
								<GroupLedger
									group={group}
									cycles={cycles}
									payments={payments}
									members={members}
								/>
							</div>
						)}
					</TabsContent>

					{/* Reports Tab */}
					<TabsContent value="reports">
						<SummaryReport
							group={group}
							cycles={cycles}
							payments={payments}
							members={members}
							currentCycle={currentCycle}
						/>
					</TabsContent>

					{/* My Ledger Tab */}
					<TabsContent value="my-ledger">
						<MemberLedger
							member={currentUser}
							payments={payments}
							cycles={cycles}
							group={group}
						/>
					</TabsContent>
				</Tabs>
			</main>

			{/* Payment Recorder Dialog */}
			{selectedMember && selectedPayment && (
				<PaymentRecorder
					open={paymentRecorderOpen}
					onClose={() => {
						setPaymentRecorderOpen(false);
						setSelectedMember(null);
						setSelectedPayment(null);
					}}
					member={selectedMember}
					payment={selectedPayment}
					group={group}
					onPaymentRecorded={handlePaymentRecorded}
				/>
			)}
		</div>
	);
}
