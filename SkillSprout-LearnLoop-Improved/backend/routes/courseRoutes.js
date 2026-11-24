const express = require('express');
const db = require('../database/db');
const { authenticate, allowRoles } = require('../middleware/auth');
const { topologicalSort } = require('../services/roadmap');
const allowedTracks = ['Full-Stack Web Development','Artificial Intelligence','Data Science'];
const router = express.Router();
const parse = row => ({ ...row, skills: JSON.parse(row.skills), prerequisites: JSON.parse(row.prerequisites), tracks: JSON.parse(row.tracks) });
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM courses ORDER BY semester, title').all();
  res.json({ courses: rows.map(parse) });
});
router.get('/roadmap', authenticate, (req, res) => {
  const user = db.prepare('SELECT goal FROM users WHERE id=?').get(req.user.id);
  const all = db.prepare('SELECT * FROM courses').all().map(parse);
  const selected = all.filter(course => course.tracks.includes(user.goal) || course.semester === 1);
  try { res.json({ courses: topologicalSort(selected, { strictPrerequisites: true }) }); }
  catch (error) { res.status(500).json({ error: 'The course prerequisite map needs attention.' }); }
});
router.post('/', authenticate, allowRoles('faculty','admin'), (req, res) => {
  const { id, title, credits, level, semester, skills, description, prerequisites = [], tracks } = req.body || {};
  if (typeof id !== 'string' || !/^[A-Z0-9_-]{3,12}$/.test(id) || typeof title !== 'string' || title.trim().length < 3 || title.length > 100) return res.status(400).json({ error: 'Enter a valid course code and title.' });
  if (!Number.isInteger(credits) || credits < 1 || credits > 10 || !['Beginner','Intermediate','Advanced'].includes(level) || !Number.isInteger(semester) || semester < 1 || semester > 8) return res.status(400).json({ error: 'Check the course credits, level and semester.' });
  if (typeof description !== 'string' || description.trim().length < 10 || description.length > 500 || !Array.isArray(skills) || skills.length < 1 || skills.length > 12 || !skills.every(skill => typeof skill === 'string' && skill.trim().length > 0 && skill.length <= 40) || !Array.isArray(prerequisites) || prerequisites.length > 20 || !prerequisites.every(value => typeof value === 'string' && /^[A-Z0-9_-]{3,12}$/.test(value)) || !Array.isArray(tracks) || tracks.length < 1 || tracks.length > 3 || !tracks.every(track => allowedTracks.includes(track))) return res.status(400).json({ error: 'Course description, skills, prerequisites or tracks are not valid.' });
  const existing = db.prepare('SELECT * FROM courses').all().map(parse);
  const knownIds = new Set(existing.map(course => course.id));
  if (prerequisites.some(prerequisite => !knownIds.has(prerequisite))) return res.status(400).json({ error: 'Every prerequisite must refer to an existing course.' });
  try {
    topologicalSort([...existing, { id, prerequisites }], { strictPrerequisites: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  try {
    db.prepare(`INSERT INTO courses (id,title,credits,level,semester,skills,description,prerequisites,tracks) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(id, title.trim(), credits, level, semester, JSON.stringify(skills.map(skill => skill.trim())), description.trim(), JSON.stringify(prerequisites), JSON.stringify(tracks));
    res.status(201).json({ course: parse(db.prepare('SELECT * FROM courses WHERE id=?').get(id)) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return res.status(409).json({ error: 'That course code is already in use.' });
    res.status(400).json({ error: 'Could not save this course. Check that its prerequisites exist.' });
  }
});
router.delete('/:id', authenticate, allowRoles('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM courses WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Course not found.' });
  res.json({ message: 'Course removed.' });
});
module.exports = router;
