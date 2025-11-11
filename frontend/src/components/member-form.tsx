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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

const MemberForm = ({ onSuccess, onCancel, groupId }) => {
	const [form, setForm] = useState({
		email: "",
		role: "member",
		phone: "",
		accountNumber: "",
		ifscCode: "",
		accountHolderName: "",
		emergencyContactName: "",
		emergencyContactPhone: "",
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

			// Prepare member data (name will be retrieved from user account)
			const memberData = {
				email: form.email,
				phone: form.phone,
				role: form.role,
				payoutAccount: {
					accountNumber: form.accountNumber,
					ifscCode: form.ifscCode,
					accountHolderName: form.accountHolderName,
				},
				emergencyContact: {
					name: form.emergencyContactName,
					phone: form.emergencyContactPhone,
				},
				confirmedJoin: false, // Will be set to true when invitation is accepted
			};

			console.log("Sending invitation request...");

			// Send invitation instead of directly creating member
			const res = await fetch("/api/invitations", {
				method: "POST",
				headers,
				body: JSON.stringify({
					groupId,
					inviteeEmail: form.email,
					role: form.role,
					memberData,
				}),
			});

			console.log("Response status:", res.status);
			if (!res.ok) {
				const errorData = await res.json();
				console.error("Invitation error response:", errorData);
				setError(
					errorData.message || errorData.error || "Failed to send invitation"
				);
				setLoading(false);
				return; // Stop execution here - don't call onSuccess
			}

			console.log("Invitation sent successfully!");

			// Show success toast
			toast.success("Invitation sent successfully!", {
				description: `An invitation has been sent to ${form.email}`,
			});

			// Only clear form and call onSuccess if invitation was successful
			setError("");
			setForm({
				email: "",
				phone: "",
				role: "member",
				accountNumber: "",
				ifscCode: "",
				accountHolderName: "",
				emergencyContactName: "",
				emergencyContactPhone: "",
			});
			setLoading(false);
			if (onSuccess) onSuccess();
		} catch (err) {
			console.error("Exception during invitation:", err);
			setError(err.message || "An unexpected error occurred");
			setLoading(false);
			// Don't call onSuccess - keep modal open to show error
		}
	};

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="space-y-1 pb-4">
				<CardTitle>Invite New Member</CardTitle>
				<CardDescription>
					Send an invitation to join your group. The member will be added once
					they accept.
				</CardDescription>
				{error && (
					<div className="mt-3 p-3 bg-destructive/10 border border-destructive/50 rounded-md text-destructive text-sm font-medium">
						⚠️ {error}
					</div>
				)}
			</CardHeader>{" "}
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-6 pb-6">
					{/* Basic Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Basic Information</h3>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={form.email}
									onChange={handleChange}
									placeholder="john@example.com"
									required
								/>
								<p className="text-xs text-muted-foreground">
									User's name will be automatically retrieved from their account
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="role">Role</Label>
								<Select
									value={form.role}
									onValueChange={(value) => setForm({ ...form, role: value })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="member">Member</SelectItem>
										<SelectItem value="auditor">Auditor</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									name="phone"
									type="tel"
									value={form.phone}
									onChange={handleChange}
									placeholder="+91 98765 43210"
									required
								/>
							</div>
						</div>
					</div>

					{/* Payout Account */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Payout Account Details</h3>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="accountHolderName">Account Holder Name</Label>
								<Input
									id="accountHolderName"
									name="accountHolderName"
									value={form.accountHolderName}
									onChange={handleChange}
									placeholder="John Doe"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="accountNumber">Account Number</Label>
								<Input
									id="accountNumber"
									name="accountNumber"
									value={form.accountNumber}
									onChange={handleChange}
									placeholder="1234567890"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="ifscCode">IFSC Code</Label>
							<Input
								id="ifscCode"
								name="ifscCode"
								value={form.ifscCode}
								onChange={handleChange}
								placeholder="SBIN0001234"
								required
							/>
						</div>
					</div>

					{/* Emergency Contact */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Emergency Contact</h3>

						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="emergencyContactName">Contact Name</Label>
								<Input
									id="emergencyContactName"
									name="emergencyContactName"
									value={form.emergencyContactName}
									onChange={handleChange}
									placeholder="Jane Doe"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="emergencyContactPhone">Contact Phone</Label>
								<Input
									id="emergencyContactPhone"
									name="emergencyContactPhone"
									type="tel"
									value={form.emergencyContactPhone}
									onChange={handleChange}
									placeholder="+91 98765 43210"
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
						{loading ? "Sending Invitation..." : "Send Invitation"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
};

export default MemberForm;
