const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db.js");
const authRoutes = require("./routes/auth.js");

const app = express();
const PORT = 4000;
app.use(cors());
app.use(express.json());

// ...existing code...

// Import routes
const groupRoutes = require("./routes/group.js");
const memberRoutes = require("./routes/member.js");
const cycleRoutes = require("./routes/cycle.js");
const paymentRoutes = require("./routes/payment.js");
const invitationRoutes = require("./routes/invitation.js");

// Group CRUD API
app.use("/api/groups", groupRoutes);

// Member CRUD API
app.use("/api/members", memberRoutes);

// Cycle CRUD API
app.use("/api/cycles", cycleRoutes);

// Payment CRUD API
app.use("/api/payments", paymentRoutes);

// Invitation API
app.use("/api/invitations", invitationRoutes);

// Auth endpoints
app.use("/api/auth", authRoutes);

// Connect to MongoDB and start server
async function startServer() {
	try {
		await connectDB();
		app.listen(PORT, () => {
			console.log(`Backend API running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error);
		process.exit(1);
	}
}

startServer();
