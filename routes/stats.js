const express = require('express');
const router  = express.Router();
const { read } = require('../utils/db');

// GET dashboard stats
router.get('/', (req, res) => {
  const db = read();
  const results = db.testResults || [];
  res.json({
    totalExams:     db.exams.length,
    totalQuestions: db.questions.length,
    totalPapers:    db.papers.length,
    publishedPapers:db.papers.filter(p => p.published).length,
    totalUsers:     db.users.length,
    totalTestsTaken:results.length,
    byExam: db.exams.map(e => ({
      id:        e.id,
      name:      e.name,
      questions: db.questions.filter(q => q.examId === e.id).length,
      papers:    db.papers.filter(p => p.examId === e.id).length,
      testsTaken:results.filter(r => r.examType === e.id || r.examType === (e.id === 'jee-main' ? 'jee' : e.id === 'neet-ug' ? 'neet' : e.id)).length,
    })),
    bySection: (() => {
      const map = {};
      db.questions.forEach(q => {
        const key = `${q.examId}::${q.section}`;
        map[key] = (map[key] || 0) + 1;
      });
      return map;
    })(),
    byDifficulty: {
      easy:   db.questions.filter(q => q.difficulty === 'easy').length,
      medium: db.questions.filter(q => q.difficulty === 'medium').length,
      hard:   db.questions.filter(q => q.difficulty === 'hard').length,
    },
  });
});

module.exports = router;
