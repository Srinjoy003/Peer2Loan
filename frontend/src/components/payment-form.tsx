import React, { useState } from "react";
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
import { Textarea } from "./ui/textarea";

const PaymentForm = ({ onSuccess, onCancel, groupId }) => {
	const [form, setForm] = useState({
		memberId: "",
		cycleId: "",
		amount: "",
		paymentDate: "",
		proofReferenceId: "",
		penaltyAmount: "",
		penaltyReason: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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
			const res = await fetch("/api/payments", {
				method: "POST",
				headers,
				body: JSON.stringify({
					groupId,
					memberId: form.memberId,
					cycleId: form.cycleId,
					amount: Number(form.amount),
					paymentDate: form.paymentDate,
					proofReferenceId: form.proofReferenceId,
					penaltyAmount: Number(form.penaltyAmount) || 0,
					penaltyReason: form.penaltyReason,
				}),
			});
			if (!res.ok) throw new Error("Failed to create payment");
			setForm({
				memberId: "",
				cycleId: "",
				amount: "",
				paymentDate: "",
				proofReferenceId: "",
				penaltyAmount: "",
				penaltyReason: "",
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
				<CardTitle>Record Payment</CardTitle>
				<CardDescription>
					Record a payment for a member in the current cycle
				</CardDescription>
			</CardHeader>

			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-6 pb-6">
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Payment Details</h3>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="memberId">Member ID</Label>
								<Input
									id="memberId"
									name="memberId"
									value={form.memberId}
									onChange={handleChange}
									placeholder="Member ID"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="cycleId">Cycle ID</Label>
								<Input
									id="cycleId"
									name="cycleId"
									value={form.cycleId}
									onChange={handleChange}
									placeholder="Cycle ID"
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="amount">Amount</Label>
								<Input
									id="amount"
									name="amount"
									type="number"
									value={form.amount}
									onChange={handleChange}
									placeholder="10000"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="paymentDate">Payment Date</Label>
								<Input
									id="paymentDate"
									name="paymentDate"
									type="date"
									value={form.paymentDate}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="proofReferenceId">
								Proof Reference ID (Optional)
							</Label>
							<Input
								id="proofReferenceId"
								name="proofReferenceId"
								value={form.proofReferenceId}
								onChange={handleChange}
								placeholder="Transaction ID or Receipt Number"
							/>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-medium">Penalty Details (Optional)</h3>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="penaltyAmount">Penalty Amount</Label>
								<Input
									id="penaltyAmount"
									name="penaltyAmount"
									type="number"
									value={form.penaltyAmount}
									onChange={handleChange}
									placeholder="0"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="penaltyReason">Penalty Reason</Label>
								<Input
									id="penaltyReason"
									name="penaltyReason"
									value={form.penaltyReason}
									onChange={handleChange}
									placeholder="Late payment"
								/>
							</div>
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
						{loading ? "Recording..." : "Record Payment"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
};

export default PaymentForm;
