

const express = require("express");
const cors = require("cors");
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


// Group CRUD API
app.use("/api/groups", groupRoutes);

// Member CRUD API
app.use("/api/members", memberRoutes);

// Cycle CRUD API
app.use("/api/cycles", cycleRoutes);

// Payment CRUD API
app.use("/api/payments", paymentRoutes);

// Auth endpoints
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});

