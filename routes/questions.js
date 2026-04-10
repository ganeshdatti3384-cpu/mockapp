const express = require('express');
const router  = express.Router();
const { v4: uuid } = require('uuid');
const { read, write } = require('../utils/db');

// GET all questions (with optional filters)
router.get('/', (req, res) => {
  const db = read();
  let qs   = db.questions;
  if (req.query.examId)   qs = qs.filter(q => q.examId   === req.query.examId);
  if (req.query.section)  qs = qs.filter(q => q.section  === req.query.section);
  if (req.query.subject)  qs = qs.filter(q => q.subject  === req.query.subject);
  if (req.query.difficulty) qs = qs.filter(q => q.difficulty === req.query.difficulty);
  res.json(qs);
});

// GET single question
router.get('/:id', (req, res) => {
  const db = read();
  const q  = db.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ message: 'Question not found' });
  res.json(q);
});

// POST create question
router.post('/', (req, res) => {
  const db = read();
  const q  = {
    id:          uuid(),
    examId:      req.body.examId,
    section:     req.body.section,
    subject:     req.body.subject || req.body.section,
    text:        req.body.text,
    options:     req.body.options,       // array of 4 strings
    correct:     req.body.correct,       // index 0-3
    explanation: req.body.explanation || '',
    difficulty:  req.body.difficulty || 'medium',
    marks:       req.body.marks       || 4,
    negative:    req.body.negative    || -1,
    tags:        req.body.tags        || [],
    createdAt:   new Date().toISOString(),
  };
  db.questions.push(q);
  write(db);
  res.status(201).json(q);
});

// POST bulk import questions
router.post('/bulk', (req, res) => {
  const db  = read();
  const qs  = req.body.questions || [];
  const created = qs.map(q => ({
    id:          uuid(),
    examId:      q.examId,
    section:     q.section,
    subject:     q.subject || q.section,
    text:        q.text,
    options:     q.options,
    correct:     q.correct,
    explanation: q.explanation || '',
    difficulty:  q.difficulty  || 'medium',
    marks:       q.marks       || 4,
    negative:    q.negative    || -1,
    tags:        q.tags        || [],
    createdAt:   new Date().toISOString(),
  }));
  db.questions.push(...created);
  write(db);
  res.status(201).json({ created: created.length, questions: created });
});

// PUT update question
router.put('/:id', (req, res) => {
  const db  = read();
  const idx = db.questions.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Question not found' });
  db.questions[idx] = { ...db.questions[idx], ...req.body, id: req.params.id };
  write(db);
  res.json(db.questions[idx]);
});

// DELETE question
router.delete('/:id', (req, res) => {
  const db  = read();
  const idx = db.questions.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Question not found' });
  db.questions.splice(idx, 1);
  write(db);
  res.json({ message: 'Deleted' });
});

// DELETE bulk by examId + section
router.delete('/bulk/:examId', (req, res) => {
  const db = read();
  const before = db.questions.length;
  db.questions = db.questions.filter(q => q.examId !== req.params.examId);
  write(db);
  res.json({ deleted: before - db.questions.length });
});

module.exports = router;
