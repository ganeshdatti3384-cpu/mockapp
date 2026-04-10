const express = require('express');
const router  = express.Router();
const { v4: uuid } = require('uuid');
const { read, write } = require('../utils/db');

// GET all papers
router.get('/', (req, res) => {
  const db = read();
  let papers = db.papers;
  if (req.query.examId) papers = papers.filter(p => p.examId === req.query.examId);
  res.json(papers);
});

// GET single paper (with full questions)
router.get('/:id', (req, res) => {
  const db    = read();
  const paper = db.papers.find(p => p.id === req.params.id);
  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  // Attach full question objects
  const questions = paper.questionIds.map(qid => db.questions.find(q => q.id === qid)).filter(Boolean);
  res.json({ ...paper, questions });
});

// POST create paper
router.post('/', (req, res) => {
  const db    = read();
  const paper = {
    id:          uuid(),
    examId:      req.body.examId,
    title:       req.body.title,
    description: req.body.description || '',
    year:        req.body.year || new Date().getFullYear(),
    duration:    req.body.duration,
    totalMarks:  req.body.totalMarks,
    sections:    req.body.sections || [],    // [{ name, questionIds }]
    questionIds: req.body.questionIds || [], // flat list for quick access
    published:   false,
    createdAt:   new Date().toISOString(),
  };
  db.papers.push(paper);
  write(db);
  res.status(201).json(paper);
});

// PUT update paper
router.put('/:id', (req, res) => {
  const db  = read();
  const idx = db.papers.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Paper not found' });
  db.papers[idx] = { ...db.papers[idx], ...req.body, id: req.params.id };
  write(db);
  res.json(db.papers[idx]);
});

// PATCH publish/unpublish
router.patch('/:id/publish', (req, res) => {
  const db  = read();
  const idx = db.papers.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Paper not found' });
  db.papers[idx].published = !db.papers[idx].published;
  write(db);
  res.json({ published: db.papers[idx].published });
});

// DELETE paper
router.delete('/:id', (req, res) => {
  const db  = read();
  const idx = db.papers.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Paper not found' });
  db.papers.splice(idx, 1);
  write(db);
  res.json({ message: 'Deleted' });
});

// GET published papers for mobile app
router.get('/mobile/published', (req, res) => {
  const db = read();
  const papers = db.papers
    .filter(p => p.published)
    .map(p => {
      const questions = p.questionIds.map(qid => db.questions.find(q => q.id === qid)).filter(Boolean);
      return { ...p, questions };
    });
  res.json(papers);
});

module.exports = router;
