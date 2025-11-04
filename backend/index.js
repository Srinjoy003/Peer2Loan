const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;
app.use(cors());
app.use(express.json());

// Import models
const group = require("./models/Group");
const members = require("./models/Member");
const cycles = require("./models/Cycle");

// API Endpoints
app.get("/api/group", (req, res) => {
	res.json(group);
});

app.get("/api/members", (req, res) => {
	res.json(members);
});

app.get("/api/cycles", (req, res) => {
	res.json(cycles);
});

app.listen(PORT, () => {
	console.log(`Backend API running on http://localhost:${PORT}`);
});

<p>
	{member.payoutAccount.accountHolderName} ({member.payoutAccount.accountNumber}
	, {member.payoutAccount.ifscCode})
</p>;
