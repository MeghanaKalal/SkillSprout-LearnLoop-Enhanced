# SkillSprout — LearnLoop

**A student learning planner that turns a big career goal into smaller, connected learning steps.**

SkillSprout is a college-level web project built to help students explore courses, follow a suggested roadmap, and keep track of learning progress. The interface uses a calm, nature-inspired visual style so the experience feels encouraging rather than crowded.

## The problem it addresses

Students often find it difficult to decide what to learn first, especially when courses depend on earlier topics. A course list alone does not explain the order. LearnLoop brings the course catalogue, prerequisite logic, and personal progress into one place.

## Main features

- Student registration and sign-in with password hashing.
- Personal learning profile: branch, semester, experience level, and goal.
- Course library with keyword search and filters for level and semester.
- Roadmap organized by semester and ordered by prerequisites.
- Enrollment and completion tracking saved in SQLite.
- Course prerequisites are checked by the server before enrollment or completion.
- Faculty/admin course management with role-based permissions.
- Dashboard cards and progress views that update from saved data.
- Responsive layout for desktop and smaller screens.

## Technology stack

| Layer | Technology | Why it is used |
|---|---|---|
| User interface | HTML, CSS, vanilla JavaScript | Lightweight, accessible browser experience |
| Server | Node.js, Express | REST API and request handling |
| Database | SQLite + better-sqlite3 | Persistent local data with relational constraints |
| Authentication | bcryptjs + JSON Web Token | Password hashing and signed sessions |
| Security | Helmet, rate limiting, validation, parameterized SQL | Safer defaults and controlled access |
| Testing | Jest + Supertest | Automated checks for the algorithm and API |

## Project structure

```text
frontend/
  index.html
  css/style.css
  js/app.js
backend/
  app.js
  server.js
  database/
    db.js
    seedCourses.js
  middleware/auth.js
  routes/
    authRoutes.js
    courseRoutes.js
    progressRoutes.js
  services/roadmap.js
tests/
  roadmap.test.js
  api.test.js
docs/
  PROJECT_REPORT.md
  TESTING_AND_DEMO.md
```

## Run the project in VS Code

**Requirements:** Node.js 18+ and npm.

1. Extract the ZIP file and open the `SkillSprout-LearnLoop-Improved` folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Replace the example `JWT_SECRET` with a random secret of at least 32 characters. Change the optional staff account values as well.
6. Start the server:

   ```bash
   npm start
   ```

7. Open `http://localhost:3000`.

The database is created automatically on first start. Its default location is `backend/database/skillsprout.sqlite`.

## Staff demo accounts

Faculty and admin accounts are optional. They are created only when the matching environment variables are set and the password is at least 12 characters long. Public registration always creates a student account.

The sample staff accounts are for a local demonstration only. Set your own values in `.env`, and never publish `.env`, a database containing personal data, or real credentials.

## Run the automated tests

```bash
npm test
```

The tests use an in-memory SQLite database. They cover prerequisite ordering and validation, account registration, duplicate email handling, access control, course creation, and student progress.

For a quick syntax check:

```bash
npm run check
```

## API summary

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a student account |
| POST | `/api/auth/login` | Public, rate-limited | Sign in |
| GET | `/api/auth/me` | Signed in | Read the current profile |
| PATCH | `/api/auth/profile` | Signed in | Update the user's own profile |
| GET | `/api/courses` | Signed in | List the course catalogue |
| GET | `/api/courses/roadmap` | Signed in | Return the selected prerequisite-ordered path |
| POST | `/api/courses` | Faculty/Admin | Add a course |
| DELETE | `/api/courses/:id` | Admin | Delete a course |
| GET | `/api/progress` | Signed in | Read the user's enrollments |
| POST | `/api/progress/:courseId/enroll` | Signed in | Enroll when prerequisites are complete |
| POST | `/api/progress/:courseId/complete` | Signed in | Mark an enrolled course complete |

## How the roadmap works

The roadmap service uses **Kahn's topological sorting algorithm**. It counts the number of prerequisites for each course, places courses with no remaining prerequisites into a queue, and then releases dependent courses as their prerequisites are processed. This gives a valid learning order for a directed acyclic prerequisite graph.

The service detects duplicate course IDs, self-dependencies, and circular prerequisite chains. API course creation and roadmap generation also use strict prerequisite validation so a missing course reference is not silently accepted.

## Important project scope

- The seeded courses are sample content for demonstration; they are not an official college syllabus.
- This is a local academic prototype, not a production learning management system.
- The browser keeps the session token in `sessionStorage`. A production deployment should use reviewed HTTPS configuration and secure, HTTP-only cookies with appropriate CSRF protection.
- A real deployment would also need database backup/migration procedures, account recovery, audit logs, and faculty approval of course content.

## Suggested presentation flow

1. Explain the student problem and the purpose of SkillSprout.
2. Register a student and complete the learning profile.
3. Show the course search and level/semester filters.
4. Attempt a course with an unfinished prerequisite and explain why the server blocks it.
5. Complete a foundation course, enroll in the next course, and show the progress update.
6. Sign out and sign in again to demonstrate that data is saved.
7. Explain the roadmap algorithm and show the tests.
8. If configured, demonstrate faculty/admin course creation and role restrictions.

See `docs/PROJECT_REPORT.md` for a ready-to-adapt report and `docs/TESTING_AND_DEMO.md` for test cases and a presentation checklist.
