import React, { useState } from "react";

const API_URL = "http://localhost:4000/api/auth";

export default function AuthForm({ onAuth }) {
	const [mode, setMode] = useState("login");
	const [signupStep, setSignupStep] = useState("form"); // 'form' or 'otp'
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [otp, setOtp] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	// Countdown timer for resend OTP
	React.useEffect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendCooldown]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			if (mode === "signup" && signupStep === "form") {
				// Step 1: Request OTP
				const res = await fetch(`${API_URL}/signup/request-otp`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password, name }),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to send OTP");
				setSignupStep("otp");
				setResendCooldown(60); // 60 second cooldown
				setError("Verification code sent to your email!");
			} else if (mode === "signup" && signupStep === "otp") {
				// Step 2: Verify OTP and create account
				const res = await fetch(`${API_URL}/signup/verify`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, otp }),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Invalid verification code");
				// Auto-login after successful verification
				sessionStorage.setItem("token", data.token);
				sessionStorage.setItem("user", JSON.stringify(data.user));
				console.log("AuthForm onAuth user:", data.user);
				onAuth && onAuth(data.user);
			} else {
				// Login mode
				const res = await fetch(`${API_URL}/login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Login failed");
				sessionStorage.setItem("token", data.token);
				sessionStorage.setItem("user", JSON.stringify(data.user));
				console.log("AuthForm onAuth user:", data.user);
				onAuth && onAuth(data.user);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (resendCooldown > 0) return;
		
		setError("");
		setLoading(true);
		try {
			const res = await fetch(`${API_URL}/signup/request-otp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password, name }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to resend OTP");
			setResendCooldown(60);
			setError("New verification code sent!");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleBackToForm = () => {
		setSignupStep("form");
		setOtp("");
		setError("");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full flex items-center justify-center">
				<div
					className="bg-card shadow-lg rounded-xl border border-border w-full"
					style={{ maxWidth: 380, padding: "2rem" }}
				>
					<h2 className="text-2xl font-semibold text-center mb-6 text-foreground">
						{mode === "signup" 
							? (signupStep === "otp" ? "Verify Email" : "Create Account")
							: "Sign In"}
					</h2>

					{mode === "signup" && signupStep === "otp" ? (
						// OTP Verification Screen
						<form
							onSubmit={handleSubmit}
							className="flex flex-col gap-4"
							style={{ padding: "0.5rem 0" }}
						>
							<p className="text-sm text-muted-foreground text-center mb-2">
								Enter the 6-digit verification code sent to <strong>{email}</strong>
							</p>
							<div>
								<label className="block text-sm text-muted-foreground mb-1">
									Verification Code
								</label>
								<input
									type="text"
									placeholder="000000"
									value={otp}
									onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
									required
									maxLength={6}
									className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
								/>
							</div>
							<button
								type="submit"
								className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-60"
								disabled={loading || otp.length !== 6}
							>
								{loading ? "Verifying..." : "Verify & Create Account"}
							</button>
							<div className="flex justify-between items-center">
								<button
									type="button"
									className="text-sm text-primary hover:underline"
									onClick={handleBackToForm}
								>
									← Back to form
								</button>
								<button
									type="button"
									className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
									onClick={handleResendOtp}
									disabled={resendCooldown > 0 || loading}
								>
									{resendCooldown > 0 
										? `Resend (${resendCooldown}s)` 
										: "Resend Code"}
								</button>
							</div>
							{error && (
								<div className={`text-sm text-center mt-2 ${error.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
									{error}
								</div>
							)}
						</form>
					) : (
						// Login / Signup Form
						<form
							onSubmit={handleSubmit}
							className="flex flex-col gap-4"
							style={{ padding: "0.5rem 0" }}
						>
							{mode === "signup" && (
								<div>
									<label className="block text-sm text-muted-foreground mb-1">
										Name
									</label>
									<input
										type="text"
										placeholder="Your name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
										className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
							)}
							<div>
								<label className="block text-sm text-muted-foreground mb-1">
									Email
								</label>
								<input
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm text-muted-foreground mb-1">
									Password
								</label>
								<input
									type="password"
									placeholder="Password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<button
								type="submit"
								className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-60"
								disabled={loading}
							>
								{loading
									? "Processing..."
									: mode === "signup"
									? "Continue"
									: "Login"}
							</button>
							<button
								type="button"
								className="w-full text-sm text-primary mt-2 hover:underline"
								onClick={() => {
									setMode(mode === "signup" ? "login" : "signup");
									setSignupStep("form");
									setOtp("");
									setError("");
								}}
							>
								{mode === "signup"
									? "Already have an account? Sign In"
									: "Don't have an account? Create one"}
							</button>
							{error && (
								<div className={`text-sm text-center mt-2 ${error.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
									{error}
								</div>
							)}
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
