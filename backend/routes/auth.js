const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { connectDB } = require('../db.js');
const { createUser, findUserByEmail } = require('../models/User.js');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// In-memory store for OTP verification (replace with Redis in production)
const otpStore = new Map();

// Configure email transporter
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});

// Generate 6-digit OTP
function generateOTP() {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'Peer2Loan - Email Verification Code',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2>Email Verification</h2>
				<p>Your verification code is:</p>
				<h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
				<p>This code will expire in 10 minutes.</p>
				<p>If you didn't request this code, please ignore this email.</p>
			</div>
		`
	};
	
	await transporter.sendMail(mailOptions);
}

// Step 1: Request OTP for signup
router.post('/signup/request-otp', async (req, res) => {
	try {
		const { email, password, name, role } = req.body;
		
		if (!email || !password || !name) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		
		// Check if email already exists
		const db = await connectDB();
		const existing = await findUserByEmail(db, email);
		if (existing) {
			return res.status(409).json({ error: 'Email already registered' });
		}
		
		// Generate OTP
		const otp = generateOTP();
		const passwordHash = await bcrypt.hash(password, 10);
		
		// Store OTP and user data temporarily (expires in 10 minutes)
		otpStore.set(email, {
			otp,
			passwordHash,
			name,
			role: role || 'member',
			expiresAt: Date.now() + 10 * 60 * 1000
		});
		
		// Send OTP email
		try {
			await sendOTPEmail(email, otp);
			console.log(`📧 OTP sent to ${email}: ${otp}`);
		} catch (emailError) {
			// If email fails, still log OTP for development
			console.log(`⚠️ Email failed, but OTP generated for ${email}: ${otp}`);
			console.log(`📝 Error: ${emailError.message}`);
			console.log(`   Check EMAIL_USER and EMAIL_PASS in .env file`);
		}
		
		return res.status(200).json({ 
			message: 'Verification code sent to email',
			email 
		});
	} catch (error) {
		console.error('Error sending OTP:', error);
		return res.status(500).json({ error: 'Failed to send verification code' });
	}
});

// Step 2: Verify OTP and create account
router.post('/signup/verify', async (req, res) => {
	try {
		const { email, otp } = req.body;
		
		if (!email || !otp) {
			return res.status(400).json({ error: 'Missing email or OTP' });
		}
		
		// Check if OTP exists
		const storedData = otpStore.get(email);
		if (!storedData) {
			return res.status(400).json({ error: 'OTP expired or not found. Please request a new code.' });
		}
		
		// Check if OTP expired
		if (Date.now() > storedData.expiresAt) {
			otpStore.delete(email);
			return res.status(400).json({ error: 'OTP expired. Please request a new code.' });
		}
		
		// Verify OTP
		if (storedData.otp !== otp) {
			return res.status(400).json({ error: 'Invalid verification code' });
		}
		
		// OTP verified - create user account
		const db = await connectDB();
		
		// Double check email doesn't exist (in case it was created between request and verify)
		const existing = await findUserByEmail(db, email);
		if (existing) {
			otpStore.delete(email);
			return res.status(409).json({ error: 'Email already registered' });
		}
		
		const userId = await createUser(db, {
			email,
			passwordHash: storedData.passwordHash,
			name: storedData.name,
			role: storedData.role
		});
		
		// Clear OTP from store
		otpStore.delete(email);
		
		console.log(`✅ Account created and verified for ${email}`);
		
		// Generate token for auto-login after signup
		const token = jwt.sign(
			{ userId, email, role: storedData.role },
			JWT_SECRET,
			{ expiresIn: '7d' }
		);
		
		return res.status(201).json({ 
			message: 'Account created successfully',
			token,
			user: { email, name: storedData.name, role: storedData.role }
		});
	} catch (error) {
		console.error('Error verifying OTP:', error);
		return res.status(500).json({ error: 'Failed to verify account' });
	}
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const db = await connectDB();
  const user = await findUserByEmail(db, email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Issue JWT
  const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user: { email: user.email, name: user.name, role: user.role } });
});

module.exports = router;
