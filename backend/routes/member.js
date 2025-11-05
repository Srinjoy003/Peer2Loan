const express = require('express');
const router = express.Router();
const Member = require('../models/Member.js');

// Create member
router.post('/', async (req, res) => {
  try {
    const id = await Member.createMember(req.body);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all members
router.get('/', async (req, res) => {
  try {
    const members = await Member.getAllMembers();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.getMemberById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const updated = await Member.updateMember(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    await Member.deleteMember(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
