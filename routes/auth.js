const express = require('express');
const router  = express.Router();
const { read } = require('../utils/db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = read();
  if (username === db.admin.username && password === db.admin.password) {
    return res.json({ success: true, token: 'mockprep-admin-token', username });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

module.exports = router;
