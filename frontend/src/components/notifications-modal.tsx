import { useState, useEffect } from "react";
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
import { Badge } from "./ui/badge";
import { Invitation } from "../types";
import { formatDate } from "../lib/utils";
import { Bell, Check, X, Users, Mail } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface NotificationsModalProps {
	userEmail: string;
	onClose: () => void;
	onInvitationProcessed?: () => void;
}

export function NotificationsModal({
	userEmail,
	onClose,
	onInvitationProcessed,
}: NotificationsModalProps) {
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [processingId, setProcessingId] = useState<string | null>(null);

	useEffect(() => {
		fetchInvitations();
	}, [userEmail]);

	async function fetchInvitations() {
		try {
			setLoading(true);
			const token = sessionStorage.getItem("token");
			const headers = token ? { Authorization: `Bearer ${token}` } : {};

			const response = await fetch(
				`/api/invitations/my-invitations?email=${encodeURIComponent(
					userEmail
				)}`,
				{
					headers,
				}
			);

			if (!response.ok) throw new Error("Failed to fetch invitations");

			const data = await response.json();
			setInvitations(data);
			setError("");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	async function handleAccept(invitationId: string) {
		try {
			setProcessingId(invitationId);
			const token = sessionStorage.getItem("token");
			const headers: HeadersInit = {
				"Content-Type": "application/json",
			};

			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}

			const response = await fetch(`/api/invitations/${invitationId}/accept`, {
				method: "POST",
				headers,
			});

			if (!response.ok) throw new Error("Failed to accept invitation");

			// Get invitation details for toast message
			const invitation = invitations.find(
				(inv) => (inv._id || inv.id) === invitationId
			);

			// Remove the accepted invitation from the list
			setInvitations((prev) =>
				prev.filter((inv) => (inv._id || inv.id) !== invitationId)
			);

			// Show success toast
			toast.success("Invitation accepted!", {
				description: invitation
					? `You've joined ${invitation.groupName}`
					: "You've successfully joined the group",
			});

			// Notify parent to refresh members
			if (onInvitationProcessed) {
				onInvitationProcessed();
			}
		} catch (err: any) {
			toast.error("Failed to accept invitation", {
				description: err.message,
			});
		} finally {
			setProcessingId(null);
		}
	}

	async function handleReject(invitationId: string) {
		try {
			setProcessingId(invitationId);
			const token = sessionStorage.getItem("token");
			const headers: HeadersInit = {
				"Content-Type": "application/json",
			};

			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}

			const response = await fetch(`/api/invitations/${invitationId}/reject`, {
				method: "POST",
				headers,
			});

			if (!response.ok) throw new Error("Failed to reject invitation");

			// Get invitation details for toast message
			const invitation = invitations.find(
				(inv) => (inv._id || inv.id) === invitationId
			);

			// Remove the rejected invitation from the list
			setInvitations((prev) =>
				prev.filter((inv) => (inv._id || inv.id) !== invitationId)
			);

			// Show info toast
			toast.info("Invitation rejected", {
				description: invitation
					? `You've declined the invitation to ${invitation.groupName}`
					: "Invitation declined",
			});
		} catch (err: any) {
			toast.error("Failed to reject invitation", {
				description: err.message,
			});
		} finally {
			setProcessingId(null);
		}
	}

	return (
		<div
			className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
			onClick={onClose}
		>
			<div
				className="w-full max-w-4xl mx-4 overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				<Card className="h-full flex flex-col overflow-hidden">
					<CardHeader className="flex-shrink-0 pb-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Bell className="w-5 h-5" />
								<CardTitle>Notifications</CardTitle>
							</div>
							<Button variant="ghost" size="sm" onClick={onClose}>
								<X className="w-4 h-4" />
							</Button>
						</div>
						<CardDescription>
							You have {invitations.length} pending invitation
							{invitations.length !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>

					<CardContent className="flex-1 overflow-y-auto min-h-0 p-6 pt-2">
						{loading ? (
							<div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
								Loading invitations...
							</div>
						) : error ? (
							<div className="flex items-center justify-center min-h-[200px] text-destructive">
								Error: {error}
							</div>
						) : invitations.length === 0 ? (
							<div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
								<Bell className="w-12 h-12 mb-4 opacity-20" />
								<p>No pending invitations</p>
							</div>
						) : (
							<div className="space-y-4">
								{invitations.map((invitation) => {
									const invId = invitation._id || invitation.id;
									const isProcessing = processingId === invId;

									return (
										<Card key={invId} className="border-2">
											<CardHeader className="pb-3">
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-2">
														<Users className="w-5 h-5 text-primary" />
														<CardTitle className="text-lg">
															Join {invitation.groupName}
														</CardTitle>
													</div>
													<Badge variant="outline">{invitation.role}</Badge>
												</div>
											</CardHeader>

											<CardContent className="space-y-2 pb-3">
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<Mail className="w-4 h-4" />
													<span>Invited to: {invitation.inviteeEmail}</span>
												</div>

												{invitation.groupDetails && (
													<div className="text-sm space-y-1 mt-2 p-3 bg-muted/50 rounded-md">
														<p>
															<strong>Monthly Contribution:</strong>{" "}
															{invitation.groupDetails.currency}{" "}
															{invitation.groupDetails.monthlyContribution?.toLocaleString()}
														</p>
														<p>
															<strong>Group Size:</strong>{" "}
															{invitation.groupDetails.groupSize} members
														</p>
														<p>
															<strong>Duration:</strong>{" "}
															{invitation.groupDetails.duration} months
														</p>
													</div>
												)}

												<p className="text-xs text-muted-foreground mt-2">
													Invited {formatDate(invitation.createdAt)}
												</p>
											</CardContent>

											<CardFooter className="flex gap-2 pt-3 border-t">
												<Button
													onClick={() => handleAccept(invId!)}
													disabled={isProcessing}
													className="flex-1"
													size="sm"
												>
													<Check className="w-4 h-4 mr-2" />
													Accept
												</Button>
												<Button
													onClick={() => handleReject(invId!)}
													disabled={isProcessing}
													variant="outline"
													className="flex-1"
													size="sm"
												>
													<X className="w-4 h-4 mr-2" />
													Reject
												</Button>
											</CardFooter>
										</Card>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
