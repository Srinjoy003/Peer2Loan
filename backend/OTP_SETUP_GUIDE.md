# OTP Email Verification Setup Guide

## Implementation Complete ✅

The signup process now requires email verification via OTP (One-Time Password).

### What Was Changed

#### Backend Changes (`backend/routes/auth.js`)
1. **New Endpoints**:
   - `POST /api/auth/signup/request-otp` - Sends 6-digit OTP to email
   - `POST /api/auth/signup/verify` - Verifies OTP and creates account

2. **Features**:
   - 6-digit random OTP generation
   - 10-minute OTP expiration
   - HTML email template with styled OTP display
   - Automatic login after successful verification (returns JWT token)
   - In-memory OTP storage (temporary Map)

#### Frontend Changes (`frontend/src/components/AuthForm.tsx`)
1. **Two-Step Signup Flow**:
   - Step 1: User enters name, email, password → OTP sent to email
   - Step 2: User enters 6-digit code → Account created and logged in

2. **Features**:
   - OTP input field with auto-formatting (digits only, max 6)
   - "Resend Code" button with 60-second cooldown
   - "Back to form" button to edit email/password
   - Visual feedback for success/error messages

#### Dependencies Added
- `resend` - Modern email API (no personal email required!)
- `dotenv` - Environment variable management

---

## Setup Instructions

### 1. Get Resend API Key (Free - No Credit Card Required)

1. Go to [resend.com](https://resend.com/)
2. Click "Start Building" or "Sign Up"
3. Sign up with GitHub or email
4. Go to [API Keys page](https://resend.com/api-keys)
5. Click "Create API Key"
6. Name it "Peer2Loan Development"
7. Copy the API key (starts with `re_`)

**Free Tier**: 100 emails/day, 3,000 emails/month - perfect for development!

### 2. Configure Environment Variable

Create a file named `.env` in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Resend API key:

```env
RESEND_API_KEY=re_your_api_key_here
```

### 3. Restart Backend Server

```bash
cd backend
npm start
```

---

## Testing the OTP Flow

### Test Signup Process:

1. **Open Frontend** → Click "Create Account"
2. **Enter Details**:
   - Name: Test User
   - Email: your-test-email@gmail.com
   - Password: test123
3. **Click "Continue"** → OTP sent to email
4. **Check Email** → Look for email from your configured address
5. **Enter OTP** → Type 6-digit code from email
6. **Click "Verify & Create Account"** → Account created and logged in

### Expected Email:
```
From: Peer2Loan <onboarding@resend.dev>
Subject: Peer2Loan - Email Verification Code

[Formatted HTML Email]
Your verification code is:

123456

This code will expire in 10 minutes.
```

**Note**: Emails sent from `onboarding@resend.dev` (Resend's test domain). To use your own domain, add it in Resend dashboard.

---

## Troubleshooting

### Email Not Received
- ✅ Check spam/junk folder
- ✅ Verify `RESEND_API_KEY` in `.env` file
- ✅ Check Resend dashboard for delivery status
- ✅ Check backend console for error messages
- ✅ Ensure API key starts with `re_`

### "Invalid verification code" Error
- ✅ Check if OTP expired (10 minutes)
- ✅ Verify you entered all 6 digits correctly
- ✅ Try clicking "Resend Code" to get a new OTP

### Backend Errors
Common errors in console:
- `Missing API key` - `RESEND_API_KEY` not set in `.env`
- `Invalid API key` - Wrong API key or expired
- `Rate limit exceeded` - Too many emails sent (free tier: 100/day)

---

## Production Considerations

### Current Limitations (Development Setup)
⚠️ **In-Memory OTP Storage**: OTPs stored in JavaScript Map
- **Problem**: Lost when server restarts
- **Problem**: Doesn't work with multiple server instances

⚠️ **No Rate Limiting**: Users can request unlimited OTPs

⚠️ **No Brute Force Protection**: Unlimited OTP verification attempts

### Recommended Production Improvements

1. **Replace In-Memory Storage with Redis**:
   ```javascript
   // Instead of: const otpStore = new Map();
   const redis = require('redis');
   const client = redis.createClient();
   ```

2. **Add Rate Limiting**:
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const otpLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 3 // limit each IP to 3 requests per windowMs
   });
   
   router.post('/signup/request-otp', otpLimiter, async (req, res) => {
     // ... OTP sending logic
   });
   ```

3. **Add Brute Force Protection**:
   ```javascript
   // Track failed attempts per email
   // Lock account after 5 failed OTP verifications
   ```

4. **Use Custom Domain with Resend**:
   - Add your domain in [Resend Dashboard](https://resend.com/domains)
   - Verify DNS records (SPF, DKIM, DMARC)
   - Change `from` address to use your domain:
   ```javascript
   from: 'Peer2Loan <noreply@yourdomain.com>'
   ```

5. **Add SMS Alternative**:
   - Twilio SMS for OTP delivery
   - Allow users to choose email or SMS

6. **Store Verification Status**:
   ```javascript
   // Add to User model
   {
     email: String,
     emailVerified: { type: Boolean, default: false },
     emailVerifiedAt: Date
   }
   ```

---

## Security Notes

✅ **OTP Expiration**: 10 minutes (configurable in `auth.js`)
✅ **HTTPS**: Use HTTPS in production to encrypt OTP transmission
✅ **Email Encryption**: SMTP connection uses TLS (port 465)
✅ **Password Hashing**: User passwords hashed with bcrypt before storage
✅ **JWT Token**: Secure authentication after verification

⚠️ **Current Security Gaps**:
- No account lockout after failed attempts
- No IP-based rate limiting
- In-memory storage not persistent
- No email change verification

---

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │
│  AuthForm   │
└──────┬──────┘
       │
       │ 1. POST /signup/request-otp
       │    { email, password, name }
       ▼
┌─────────────────────────────┐
│  Backend: /routes/auth.js   │
├─────────────────────────────┤
│  • Validate user data       │
│  • Check if email exists    │
│  • Generate 6-digit OTP     │
│  • Store in otpStore Map    │
│  • Send email via nodemailer│
└──────┬──────────────────────┘
       │
       │ 2. Email sent via Gmail SMTP
       ▼
┌─────────────┐
│  User Email │ ← "Your code is: 123456"
└──────┬──────┘
       │
       │ 3. User enters OTP in frontend
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       │ 4. POST /signup/verify
       │    { email, otp: "123456" }
       ▼
┌─────────────────────────────┐
│  Backend: /routes/auth.js   │
├─────────────────────────────┤
│  • Lookup OTP in otpStore   │
│  • Check expiration         │
│  • Validate OTP matches     │
│  • Create user in MongoDB   │
│  • Generate JWT token       │
│  • Return token + user data │
└──────┬──────────────────────┘
       │
       │ 5. Auto-login with JWT
       ▼
┌─────────────┐
│   App Home  │
│  (Logged In)│
└─────────────┘
```

---

## Files Modified

✅ `backend/routes/auth.js` - Added OTP endpoints
✅ `backend/package.json` - Added nodemailer dependency
✅ `backend/index.js` - Added dotenv config
✅ `frontend/src/components/AuthForm.tsx` - Two-step signup UI
✅ `backend/.env.example` - Email config template

---

## Next Steps

1. ✅ Configure `.env` with email credentials
2. ✅ Test signup flow with real email
3. 📋 Consider production improvements (Redis, rate limiting)
4. 📋 Add email verification status to user profile
5. 📋 Implement "Resend verification email" for existing users
6. 📋 Add password reset flow with OTP verification

---

**Implementation Status**: ✅ Complete and Ready for Testing

**Last Updated**: ${new Date().toISOString().split('T')[0]}
