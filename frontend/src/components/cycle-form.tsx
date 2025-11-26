import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

const CycleForm = ({
	onSuccess,
	onCancel,
	groupId,
	cycles = [],
	members = [],
	group = null,
}) => {
	// Debug: Log cycles data
	// debug logs removed

	// Calculate next cycle number
	const nextCycleNumber =
		cycles.length > 0 ? Math.max(...cycles.map((c) => c.cycleNumber)) + 1 : 1;

	// Calculate next payout recipient based on fixed order
	const getNextPayoutRecipient = () => {
		const contributingMembers = members.filter((m) => m.role !== "auditor");

		if (contributingMembers.length === 0) return null;

		// Sort by join date or createdAt
		const sortedMembers = [...contributingMembers].sort((a, b) => {
			const dateA = new Date(a.joinedAt || a.createdAt || 0).getTime();
			const dateB = new Date(b.joinedAt || b.createdAt || 0).getTime();
			return dateA - dateB;
		});

		// Get executed cycles (payouts that have been completed)
		const executedCycles = cycles.filter((c) => c.payoutExecuted);
		const executedRecipients = executedCycles.map((c) => c.payoutRecipientId);

		// Find members who haven't received payout yet
		const remainingMembers = sortedMembers.filter(
			(m) => !executedRecipients.includes(m.id || m._id)
		);

		// If everyone has received, start new round
		if (remainingMembers.length === 0) {
			return sortedMembers[0];
		}

		return remainingMembers[0];
	};

	const [form, setForm] = useState({
		cycleNumber: nextCycleNumber.toString(),
		payoutConfirmed: false,
		payoutProofReferenceId: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Update cycle number if cycles change
	useEffect(() => {
		const newCycleNumber =
			cycles.length > 0 ? Math.max(...cycles.map((c) => c.cycleNumber)) + 1 : 1;

		setForm((prev) => ({ ...prev, cycleNumber: newCycleNumber.toString() }));
	}, [cycles]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm({ ...form, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const token = sessionStorage.getItem("token");
			const headers = {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			};
			const payload = {
				groupId,
				cycleNumber: Number(form.cycleNumber),
				// Backend will auto-assign recipient based on fixed order
				// Ensure dashboard date/deadline render correctly
				month: new Date().toISOString(),
				deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				contributions: [],
				potTotal: 0,
				payoutExecuted: false,
				status: "active",
			};

			const res = await fetch("/api/cycles", {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			const resBody = await res.json().catch(() => ({}));

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(
					errorData.message || errorData.error || "Failed to create cycle"
				);
			}

			const nextRecipient = getNextPayoutRecipient();
			toast.success("Cycle created successfully!", {
				description: `Cycle #${form.cycleNumber}${
					nextRecipient ? ` with payout to ${nextRecipient.name}` : ""
				}`,
			});

			setForm({
				cycleNumber: "",
				payoutConfirmed: false,
				payoutProofReferenceId: "",
			});
			if (onSuccess) onSuccess();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="space-y-1 pb-4">
				<CardTitle>Add New Cycle</CardTitle>
				<CardDescription>
					Create a new cycle for your group with payout details
				</CardDescription>
			</CardHeader>

			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-6 pb-6">
					{error && (
						<div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<h3 className="text-lg font-medium">Cycle Information</h3>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="cycleNumber">Cycle Number</Label>
								<Input
									id="cycleNumber"
									name="cycleNumber"
									type="number"
									value={form.cycleNumber}
									onChange={handleChange}
									placeholder="1"
									required
									readOnly
									className="bg-muted cursor-not-allowed"
								/>
								<p className="text-sm text-muted-foreground">
									Auto-generated sequential cycle number
								</p>
							</div>{" "}
							<div className="space-y-2">
								<Label>Next Payout Recipient</Label>
								<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
									{(() => {
										if (group?.turnOrderPolicy === "randomized") {
											return (
												<div className="space-y-1">
													<p className="font-semibold text-lg text-blue-900 dark:text-blue-100">
														🎲 Random Selection
													</p>
													<p className="text-sm text-blue-700 dark:text-blue-300">
														Recipient will be randomly selected from eligible
														members
													</p>
													<p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
														ℹ️ Using randomized turn order policy
													</p>
												</div>
											);
										}

										const nextRecipient = getNextPayoutRecipient();
										if (!nextRecipient) {
											return (
												<p className="text-sm text-muted-foreground">
													No eligible members for payout
												</p>
											);
										}
										return (
											<div className="space-y-1">
												<p className="font-semibold text-lg text-blue-900 dark:text-blue-100">
													{nextRecipient.name}
												</p>
												<p className="text-sm text-blue-700 dark:text-blue-300">
													{nextRecipient.email}
												</p>
												<p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
													ℹ️ Recipient is automatically assigned based on fixed
													turn order
												</p>
											</div>
										);
									})()}
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="payoutProofReferenceId">
								Payout Proof Reference ID (Optional)
							</Label>
							<Input
								id="payoutProofReferenceId"
								name="payoutProofReferenceId"
								value={form.payoutProofReferenceId}
								onChange={handleChange}
								placeholder="Reference ID"
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="payoutConfirmed"
								checked={form.payoutConfirmed}
								onCheckedChange={(checked) =>
									setForm({ ...form, payoutConfirmed: checked })
								}
							/>
							<Label htmlFor="payoutConfirmed" className="cursor-pointer">
								Payout Confirmed
							</Label>
						</div>
					</div>

					{error && (
						<div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
							{error}
						</div>
					)}
				</CardContent>

				<CardFooter className="flex justify-end gap-3 pt-6 pb-6">
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={loading}
						>
							Cancel
						</Button>
					)}
					<Button type="submit" disabled={loading}>
						{loading ? "Creating..." : "Add Cycle"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
};

export default CycleForm;
