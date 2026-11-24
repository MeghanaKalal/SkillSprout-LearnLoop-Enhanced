const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const seedCourses = require('./seedCourses');

const file = process.env.DATABASE_FILE || path.join(__dirname, 'skillsprout.sqlite');
if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
const db = new Database(file);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 40),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','faculty','admin')),
  branch TEXT NOT NULL DEFAULT 'CSE',
  semester INTEGER NOT NULL DEFAULT 1 CHECK(semester BETWEEN 1 AND 8),
  experience TEXT NOT NULL DEFAULT 'New to coding',
  goal TEXT NOT NULL DEFAULT 'Full-Stack Web Development',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK(credits BETWEEN 1 AND 10),
  level TEXT NOT NULL CHECK(level IN ('Beginner','Intermediate','Advanced')),
  semester INTEGER NOT NULL CHECK(semester BETWEEN 1 AND 8),
  skills TEXT NOT NULL,
  description TEXT NOT NULL,
  prerequisites TEXT NOT NULL,
  tracks TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS enrollments (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  PRIMARY KEY(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
`);

const insertCourse = db.prepare(`INSERT OR IGNORE INTO courses
(id,title,credits,level,semester,skills,description,prerequisites,tracks)
VALUES (@id,@title,@credits,@level,@semester,@skills,@description,@prerequisites,@tracks)`);
const seed = db.transaction(() => seedCourses.forEach(course => insertCourse.run({
  ...course, skills: JSON.stringify(course.skills), prerequisites: JSON.stringify(course.prerequisites), tracks: JSON.stringify(course.tracks)
})));
seed();

function seedStaffFromEnv() {
  const staff = [
    { name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' },
    { name: process.env.FACULTY_NAME, email: process.env.FACULTY_EMAIL, password: process.env.FACULTY_PASSWORD, role: 'faculty' }
  ];
  const insert = db.prepare('INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES (?,?,?,?)');
  for (const person of staff) {
    if (person.name && person.email && person.password && person.password.length >= 12) {
      insert.run(person.name, person.email.toLowerCase(), bcrypt.hashSync(person.password, 12), person.role);
    }
  }
}
seedStaffFromEnv();
module.exports = db;
