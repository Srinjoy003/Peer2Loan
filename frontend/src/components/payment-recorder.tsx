import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Member, Payment, Group } from "../types";
import { formatCurrency } from "../lib/utils";
import { Upload, CheckCircle2, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";

interface PaymentRecorderProps {
	open: boolean;
	onClose: () => void;
	member: Member;
	payment: Payment;
	group: Group;
	cycleId: string;
	members: Member[];
	payments: Payment[];
	onPaymentRecorded: (paymentId: string, proof: string, paidOn: string) => void;
	onPaymentsUpdated: () => void;
}

export function PaymentRecorder({
	open,
	onClose,
	member,
	payment,
	group,
	cycleId,
	members,
	payments,
	onPaymentRecorded,
	onPaymentsUpdated,
}: PaymentRecorderProps) {
	const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
	const [showRejectDialog, setShowRejectDialog] = useState(false);
	const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
		null
	);
	const [rejectionReason, setRejectionReason] = useState("");

	useEffect(() => {
		if (open) {
			// Fetch pending payments for this cycle
			const pending = payments.filter(
				(p) => p.cycleId === cycleId && p.status === "pending_approval"
			);
			setPendingPayments(pending);
		}
	}, [open, cycleId, payments]);

	const handleApprove = async (paymentId: string) => {
		try {
			const token = sessionStorage.getItem("token");
			const response = await fetch(
				`http://localhost:4000/api/payments/${paymentId}/approve`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ groupId: group.id }),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to approve payment");
			}

			toast.success("Payment approved successfully!");
			onPaymentsUpdated();

			// Refresh pending payments list
			const updatedPending = pendingPayments.filter((p) => p.id !== paymentId);
			setPendingPayments(updatedPending);
		} catch (error) {
			toast.error("Failed to approve payment");
			console.error(error);
		}
	};

	const handleReject = async () => {
		if (!selectedPaymentId || !rejectionReason.trim()) {
			toast.error("Please provide a rejection reason");
			return;
		}

		try {
			const token = sessionStorage.getItem("token");
			const response = await fetch(
				`http://localhost:4000/api/payments/${selectedPaymentId}/reject`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						reason: rejectionReason,
						groupId: group.id,
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to reject payment");
			}

			toast.success("Payment rejected");
			onPaymentsUpdated();

			// Refresh pending payments list
			const updatedPending = pendingPayments.filter(
				(p) => p.id !== selectedPaymentId
			);
			setPendingPayments(updatedPending);

			setShowRejectDialog(false);
			setSelectedPaymentId(null);
			setRejectionReason("");
		} catch (error) {
			toast.error("Failed to reject payment");
			console.error(error);
		}
	};

	const getMemberName = (memberId: string) => {
		return members.find((m) => m.id === memberId)?.name || "Unknown";
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onClose}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Verify Payments</DialogTitle>
						<DialogDescription>
							Review and approve or reject pending payment requests from members
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{pendingPayments.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p>No pending payment requests</p>
							</div>
						) : (
							pendingPayments.map((p) => (
								<div key={p.id} className="border rounded-lg p-4 space-y-3">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold">
												{getMemberName(p.memberId)}
											</p>
											<p className="text-sm text-muted-foreground">
												Submitted {new Date(p.createdAt).toLocaleDateString()}
											</p>
										</div>
										<Badge variant="secondary">
											<Clock className="w-3 h-3 mr-1" />
											Pending
										</Badge>
									</div>

									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<p className="text-muted-foreground">Amount</p>
											<p className="font-medium">
												{formatCurrency(p.amount, group.currency)}
											</p>
										</div>
										{p.proof && (
											<div>
												<p className="text-muted-foreground">Proof</p>
												<p className="font-medium truncate">{p.proof}</p>
											</div>
										)}
									</div>

									<div className="flex gap-2">
										<Button
											onClick={() => handleApprove(p.id)}
											className="flex-1"
											size="sm"
										>
											<Check className="w-4 h-4 mr-1" />
											Approve
										</Button>
										<Button
											onClick={() => {
												setSelectedPaymentId(p.id);
												setShowRejectDialog(true);
											}}
											variant="destructive"
											className="flex-1"
											size="sm"
										>
											<X className="w-4 h-4 mr-1" />
											Reject
										</Button>
									</div>
								</div>
							))
						)}
					</div>

					<DialogFooter className="flex gap-2">
						<Button variant="outline" onClick={onClose}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>{" "}
			<AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reject Payment Request</AlertDialogTitle>
						<AlertDialogDescription>
							Please provide a reason for rejecting this payment request.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Textarea
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							placeholder="Reason for rejection..."
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => {
								setShowRejectDialog(false);
								setSelectedPaymentId(null);
								setRejectionReason("");
							}}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleReject}
							disabled={!rejectionReason.trim()}
						>
							Reject Payment
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
