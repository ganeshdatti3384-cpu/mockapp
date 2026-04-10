const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Simple token auth middleware (skip for mobile/public routes)
function auth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== 'mockprep-admin-token') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Public routes (mobile app reads these) — must be BEFORE auth middleware
app.get('/api/papers/mobile/published', (req, res) => {
  const { read } = require('./utils/db');
  const db = read();
  const papers = db.papers
    .filter(p => p.published)
    .map(p => {
      const questions = (p.questionIds || []).map(qid => db.questions.find(q => q.id === qid)).filter(Boolean);
      return { ...p, questions };
    });
  res.json(papers);
});

// Public: save test result from mobile app
app.post('/api/mobile/results', (req, res) => {
  const { read, write } = require('./utils/db');
  const { v4: uuid } = require('uuid');
  const db = read();
  if (!db.testResults) db.testResults = [];
  const result = {
    id:        uuid(),
    userId:    req.body.userId,
    examType:  req.body.examType,
    examName:  req.body.examName,
    score:     req.body.score,
    totalMarks:req.body.totalMarks,
    scorePct:  req.body.scorePct,
    correct:   req.body.correct,
    wrong:     req.body.wrong,
    skipped:   req.body.skipped,
    duration:  req.body.duration,
    date:      req.body.date || new Date().toISOString(),
  };
  db.testResults.push(result);
  write(db);
  res.status(201).json(result);
});

// Public: get test results for a specific user
app.get('/api/mobile/results/:userId', (req, res) => {
  const { read } = require('./utils/db');
  const db = read();
  const results = (db.testResults || []).filter(r => r.userId === req.params.userId);
  res.json(results);
});

// Public: get all active exams for mobile
app.get('/api/mobile/exams', (req, res) => {
  const { read } = require('./utils/db');
  const db = read();
  const exams = db.exams
    .filter(e => e.active)
    .map(e => {
      const mobileId = e.id === 'jee-main' ? 'jee' : e.id === 'neet-ug' ? 'neet' : e.id;
      return {
        ...e,
        id: mobileId,
        originalId: e.id,   // keep original so questionLoader can match papers
        questionCount: db.questions.filter(q => q.examId === e.id).length || e.questionCount || 0,
      };
    });
  res.json(exams);
});

// Auth
app.use('/api/auth', require('./routes/auth'));

// User registration & login (public)
app.use('/api/users', require('./routes/users'));

// Protected admin routes
app.use('/api/exams',     auth, require('./routes/exams'));
app.use('/api/questions', auth, require('./routes/questions'));
app.use('/api/papers',    auth, require('./routes/papers'));
app.use('/api/stats',     auth, require('./routes/stats'));

// Admin: get all test results (with optional userId filter)
app.get('/api/results', auth, (req, res) => {
  const { read } = require('./utils/db');
  const db = read();
  let results = db.testResults || [];
  if (req.query.userId) results = results.filter(r => r.userId === req.query.userId);
  res.json(results);
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  MockPrep Backend running`);
  console.log(`🖥️   Local:    http://localhost:${PORT}/api`);
  console.log(`📱  Network:  http://192.168.29.206:${PORT}/api`);
  console.log(`📊  Admin:    http://localhost:${PORT}/api/stats\n`);
});
