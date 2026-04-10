const express = require('express');
const router  = express.Router();
const { v4: uuid } = require('uuid');
const { read, write } = require('../utils/db');

// GET all exams
router.get('/', (req, res) => {
  const db = read();
  res.json(db.exams);
});

// GET single exam
router.get('/:id', (req, res) => {
  const db   = read();
  const exam = db.exams.find(e => e.id === req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  res.json(exam);
});

// POST create exam
router.post('/', (req, res) => {
  const db   = read();
  const exam = {
    id: req.body.id || req.body.name.toLowerCase().replace(/\s+/g, '-'),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  db.exams.push(exam);
  write(db);
  res.status(201).json(exam);
});

// PUT update exam
router.put('/:id', (req, res) => {
  const db  = read();
  const idx = db.exams.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Exam not found' });
  db.exams[idx] = { ...db.exams[idx], ...req.body, id: req.params.id };
  write(db);
  res.json(db.exams[idx]);
});

// DELETE exam
router.delete('/:id', (req, res) => {
  const db  = read();
  const idx = db.exams.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Exam not found' });
  db.exams.splice(idx, 1);
  write(db);
  res.json({ message: 'Deleted' });
});

module.exports = router;
