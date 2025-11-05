const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../db.js');
const { createUser, findUserByEmail } = require('../models/User.js');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const db = await connectDB();
  const existing = await findUserByEmail(db, email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await createUser(db, { email, passwordHash, name, role });
  return res.status(201).json({ userId });
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
