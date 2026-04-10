const express = require('express');
const router  = express.Router();
const { v4: uuid } = require('uuid');
const { read, write } = require('../utils/db');

// POST /api/users/register
router.post('/register', (req, res) => {
  const db = read();
  const { name, email, password, phone, targetExam, city, state, schoolName, currentClass } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password are required.' });

  if (db.users.find(u => u.email === email.toLowerCase()))
    return res.status(409).json({ message: 'An account with this email already exists.' });

  const user = {
    id:           uuid(),
    name:         name.trim(),
    email:        email.trim().toLowerCase(),
    password,                          // plain text for demo; hash in production
    phone:        phone        || '',
    targetExam:   targetExam   || '',
    city:         city         || '',
    state:        state        || '',
    schoolName:   schoolName   || '',
    currentClass: currentClass || '',
    bio:          '',
    avatar:       '',
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
  };

  db.users.push(user);
  write(db);

  const { password: _, ...safe } = user;
  res.status(201).json({ user: safe });
});

// POST /api/users/login
router.post('/login', (req, res) => {
  const db = read();
  const { email, password } = req.body;
  const found = db.users.find(u => u.email === email.toLowerCase() && u.password === password);
  if (!found) return res.status(401).json({ message: 'Invalid email or password.' });
  const { password: _, ...safe } = found;
  res.json({ user: safe });
});

// GET /api/users/:id  (protected — own profile or admin)
router.get('/:id', (req, res) => {
  const db   = read();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// PUT /api/users/:id  — update profile
router.put('/:id', (req, res) => {
  const db  = read();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found.' });

  // Fields allowed to update
  const allowed = ['name','phone','targetExam','city','state','schoolName','currentClass','bio','avatar'];
  allowed.forEach(k => {
    if (req.body[k] !== undefined) db.users[idx][k] = req.body[k];
  });
  db.users[idx].updatedAt = new Date().toISOString();
  write(db);

  const { password: _, ...safe } = db.users[idx];
  res.json(safe);
});

// PUT /api/users/:id/password  — change password
router.put('/:id/password', (req, res) => {
  const db  = read();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found.' });

  const { currentPassword, newPassword } = req.body;
  if (db.users[idx].password !== currentPassword)
    return res.status(400).json({ message: 'Current password is incorrect.' });
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });

  db.users[idx].password  = newPassword;
  db.users[idx].updatedAt = new Date().toISOString();
  write(db);
  res.json({ message: 'Password updated successfully.' });
});

// ── Admin: list all users ──
router.get('/', (req, res) => {
  const db = read();
  const safe = db.users.map(({ password: _, ...u }) => u);
  res.json(safe);
});

// ── Admin: delete user ──
router.delete('/:id', (req, res) => {
  const db  = read();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found.' });
  db.users.splice(idx, 1);
  write(db);
  res.json({ message: 'User deleted.' });
});

module.exports = router;
