const express = require('express');
const { createGroup, getGroupById, getAllGroups, updateGroup, deleteGroup } = require('../models/Group.js');

const router = express.Router();

// Create a new group
router.post('/', async (req, res) => {
  try {
    const groupId = await createGroup(req.body);
    res.status(201).json({ groupId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await getAllGroups();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a group by ID
router.get('/:id', async (req, res) => {
  try {
    const group = await getGroupById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a group
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateGroup(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a group
router.delete('/:id', async (req, res) => {
  try {
    await deleteGroup(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
