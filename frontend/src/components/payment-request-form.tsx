import React, { useState } from "react";
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
import { Textarea } from "./ui/textarea";

interface PaymentRequestFormProps {
	cycleId: string;
	memberId: string;
	memberName: string;
	expectedAmount: number;
	currency: string;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function PaymentRequestForm({
	cycleId,
	memberId,
	memberName,
	expectedAmount,
	currency,
	onSuccess,
	onCancel,
}: PaymentRequestFormProps) {
	const [form, setForm] = useState({
		amount: expectedAmount.toString(),
		proof: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setForm({ ...form, [name]: value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const token = sessionStorage.getItem("token");
			const headers = {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			};

			const res = await fetch("/api/payments/request", {
				method: "POST",
				headers,
				body: JSON.stringify({
					cycleId,
					memberId,
					amount: Number(form.amount),
					proof: form.proof,
				}),
			});

			console.log("Payment request response:", res.status);

			if (!res.ok) {
				const errorData = await res.json();
				console.error("Payment request error:", errorData);
				throw new Error(
					errorData.message ||
						errorData.error ||
						"Failed to submit payment request"
				);
			}

			const data = await res.json();
			console.log("Payment request success:", data);
			toast.success("Payment request submitted!", {
				description: data.message || "Awaiting admin approval.",
			});

			setForm({
				amount: expectedAmount.toString(),
				proof: "",
			});

			if (onSuccess) onSuccess();
		} catch (err: any) {
			setError(err.message);
			toast.error("Failed to submit payment", {
				description: err.message,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="space-y-1 pb-4">
				<CardTitle>Submit Payment</CardTitle>
				<CardDescription>
					Submit your payment for admin approval
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
						<div className="space-y-2">
							<Label htmlFor="memberName">Member</Label>
							<Input
								id="memberName"
								value={memberName}
								disabled
								className="bg-muted"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="amount">Amount ({currency})</Label>
							<Input
								id="amount"
								name="amount"
								type="number"
								value={form.amount}
								onChange={handleChange}
								placeholder={expectedAmount.toString()}
								required
								min="0"
								step="0.01"
							/>
							<p className="text-sm text-muted-foreground">
								Expected: {currency}
								{expectedAmount}
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="proof">
								Payment Proof / Reference (Optional)
							</Label>
							<Textarea
								id="proof"
								name="proof"
								value={form.proof}
								onChange={handleChange}
								placeholder="Transaction ID, receipt number, or payment details..."
								rows={3}
							/>
							<p className="text-sm text-muted-foreground">
								Add transaction reference or proof of payment
							</p>
						</div>
					</div>
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
						{loading ? "Submitting..." : "Submit Payment"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
