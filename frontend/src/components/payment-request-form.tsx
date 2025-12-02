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
	const [proof, setProof] = useState("");
	const [testMode, setTestMode] = useState(false);
	const [submissionDate, setSubmissionDate] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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

			const requestBody = {
				cycleId,
				memberId,
				amount: expectedAmount,
				proof: proof,
				...(testMode && submissionDate ? { submissionDate } : {}),
			};

			const res = await fetch("/api/payments/request", {
				method: "POST",
				headers,
				body: JSON.stringify(requestBody),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(
					errorData.message ||
						errorData.error ||
						"Failed to submit payment request"
				);
			}

			const data = await res.json();
			toast.success("Payment request submitted!", {
				description: data.message || "Awaiting admin approval.",
			});

			setProof("");

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
								value={expectedAmount}
								disabled
								className="bg-muted"
							/>
							<p className="text-sm text-muted-foreground">
								You must pay exactly the required amount
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="proof">
								Payment Proof / Reference (Optional)
							</Label>
							<Textarea
								id="proof"
								name="proof"
								value={proof}
								onChange={(e) => setProof(e.target.value)}
								placeholder="Transaction ID, receipt number, or payment details..."
								rows={3}
							/>
							<p className="text-sm text-muted-foreground">
								Add transaction reference or proof of payment
							</p>
						</div>

						<div className="space-y-4 pt-4 border-t">
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="testMode"
									checked={testMode}
									onChange={(e) => setTestMode(e.target.checked)}
									className="h-4 w-4"
								/>
								<Label
									htmlFor="testMode"
									className="text-sm font-medium cursor-pointer"
								>
									Test Mode (Custom Submission Date)
								</Label>
							</div>

							{testMode && (
								<div className="space-y-2">
									<Label htmlFor="submissionDate">Submission Date</Label>
									<Input
										id="submissionDate"
										type="date"
										value={submissionDate}
										onChange={(e) => setSubmissionDate(e.target.value)}
										placeholder="Select date"
									/>
									<p className="text-sm text-muted-foreground">
										Set a custom date to test late fee calculation
									</p>
								</div>
							)}
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
