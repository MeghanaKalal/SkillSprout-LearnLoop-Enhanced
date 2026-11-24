const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch, semester: user.semester, experience: user.experience, goal: user.goal };
}
function issueToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: 'skillsprout' });
}
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 40) return res.status(400).json({ error: 'Please enter a name between 2 and 40 characters.' });
  if (typeof email !== 'string' || email.length > 120 || !emailPattern.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ error: 'Use a password with at least one letter and one number.' });
  try {
    const info = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(name.trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 12));
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'An account with this email already exists.' });
    throw error;
  }
});
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 120 || password.length > 72) return res.status(400).json({ error: 'Enter your email and password.' });
  const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'The email or password does not look right.' });
  return res.json({ token: issueToken(user), user: publicUser(user) });
});
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  res.json({ user: publicUser(user) });
});
router.patch('/profile', authenticate, (req, res) => {
  const { name, branch, semester, experience, goal } = req.body || {};
  const validGoals = ['Full-Stack Web Development','Artificial Intelligence','Data Science','Not sure yet'];
  const validBranches = ['CSE','CSE (AI & DS)','IT','ECE','Other'];
  const validExperience = ['New to coding','Some basics','Comfortable'];
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 40) return res.status(400).json({ error: 'Name must be between 2 and 40 characters.' });
  if (!validBranches.includes(branch) || !validExperience.includes(experience) || !validGoals.includes(goal)) return res.status(400).json({ error: 'Please choose valid profile options.' });
  const term = Number(semester);
  if (!Number.isInteger(term) || term < 1 || term > 8) return res.status(400).json({ error: 'Semester must be between 1 and 8.' });
  db.prepare('UPDATE users SET name=?,branch=?,semester=?,experience=?,goal=? WHERE id=?').run(name.trim(), branch, term, experience, goal, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ user: publicUser(user) });
});
module.exports = router;
