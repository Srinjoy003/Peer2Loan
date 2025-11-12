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
}) => {
	// Debug: Log cycles data
	// debug logs removed

	// Calculate next cycle number
	const nextCycleNumber =
		cycles.length > 0 ? Math.max(...cycles.map((c) => c.cycleNumber)) + 1 : 1;

	const [form, setForm] = useState({
		cycleNumber: nextCycleNumber.toString(),
		targetPayoutMemberId: "",
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
				targetPayoutMemberId: form.targetPayoutMemberId,
				// map email to member id when possible so UI can resolve recipient immediately
				payoutRecipientId: (
					members.find((m) => m.email === form.targetPayoutMemberId) || {}
				).id,
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

			toast.success("Cycle created successfully!", {
				description: `Cycle #${form.cycleNumber} with payout to ${form.targetPayoutMemberId}`,
			});

			setForm({
				cycleNumber: "",
				targetPayoutMemberId: "",
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
								<Label htmlFor="targetPayoutMemberId">
									Target Payout Member Email
								</Label>
								<Input
									id="targetPayoutMemberId"
									name="targetPayoutMemberId"
									type="email"
									value={form.targetPayoutMemberId}
									onChange={handleChange}
									placeholder="member@example.com"
									required
								/>
								<p className="text-sm text-muted-foreground">
									Email of the member who will receive the payout this cycle
								</p>
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
