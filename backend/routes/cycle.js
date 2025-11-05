const express = require('express');
const router = express.Router();
const Cycle = require('../models/Cycle.js');

// Create cycle
router.post('/', async (req, res) => {
  try {
    const id = await Cycle.createCycle(req.body);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all cycles
router.get('/', async (req, res) => {
  try {
    const cycles = await Cycle.getAllCycles();
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cycle by ID
router.get('/:id', async (req, res) => {
  try {
    const cycle = await Cycle.getCycleById(req.params.id);
    if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update cycle
router.put('/:id', async (req, res) => {
  try {
    const updated = await Cycle.updateCycle(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete cycle
router.delete('/:id', async (req, res) => {
  try {
    await Cycle.deleteCycle(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
