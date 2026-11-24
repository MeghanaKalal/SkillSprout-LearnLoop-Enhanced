const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare(`SELECT e.course_id AS courseId, e.enrolled_at AS enrolledAt, e.completed_at AS completedAt
    FROM enrollments e WHERE e.user_id=? ORDER BY e.enrolled_at`).all(req.user.id);
  res.json({ enrollments: rows });
});
router.post('/:courseId/enroll', authenticate, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'We could not find that course.' });
  const prerequisites = JSON.parse(course.prerequisites);
  const done = new Set(db.prepare('SELECT course_id FROM enrollments WHERE user_id=? AND completed_at IS NOT NULL').all(req.user.id).map(row => row.course_id));
  const missing = prerequisites.filter(id => !done.has(id));
  if (missing.length) return res.status(409).json({ error: `Complete these prerequisites first: ${missing.join(', ')}.` });
  db.prepare('INSERT OR IGNORE INTO enrollments (user_id,course_id) VALUES (?,?)').run(req.user.id, course.id);
  res.status(201).json({ message: 'Course added to your learning list.' });
});
router.post('/:courseId/complete', authenticate, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'We could not find that course.' });
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id=? AND course_id=?').get(req.user.id, course.id);
  if (!enrollment) return res.status(409).json({ error: 'Enroll in this course before marking it complete.' });
  const missing = JSON.parse(course.prerequisites).filter(id => !db.prepare('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=? AND completed_at IS NOT NULL').get(req.user.id, id));
  if (missing.length) return res.status(409).json({ error: `Complete prerequisites first: ${missing.join(', ')}.` });
  db.prepare('UPDATE enrollments SET completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP) WHERE user_id=? AND course_id=?').run(req.user.id, course.id);
  res.json({ message: 'Lovely work — course completed.' });
});
module.exports = router;
