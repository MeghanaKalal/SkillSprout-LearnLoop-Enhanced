# SkillSprout — LearnLoop
## Project Report

### 1. Introduction

SkillSprout is a learning roadmap web application designed for students who want a clearer starting point for developing technical skills. Instead of showing only a list of courses, LearnLoop connects courses through prerequisites and lets students record their own progress.

The project combines a simple student-facing interface with a backend that validates and stores learning activity. The design uses a soft green and cream palette, short labels, and encouraging messages to make the learning process feel approachable.

### 2. Problem statement

Students may know the skill or career they are interested in, but they may not know which topics should be learned first. Starting an advanced topic without the required foundation can make learning confusing. Students also need a convenient way to remember which courses they have started and completed.

### 3. Objectives

- Provide a single place to explore learning courses.
- Help students select a goal and view a suggested learning path.
- Represent course prerequisites and display a valid learning order.
- Prevent enrollment or completion when required prerequisites are incomplete.
- Save user profiles and progress between sessions.
- Provide separate permissions for students, faculty, and administrators.
- Keep the interface clear and usable on different screen sizes.

### 4. Proposed solution

LearnLoop provides four main student views: Overview, My Roadmap, Course Library, and My Progress. A student can create an account, set a profile, search the course catalogue, enroll in available courses, and mark completed courses. The server checks prerequisite rules before changing progress.

Faculty and administrators can add courses through a protected API. Administrators have the additional permission to remove courses. Public registration cannot assign staff roles.

### 5. Modules

**Authentication module:** Creates student accounts, verifies sign-in details, hashes passwords, and issues signed session tokens.

**Profile module:** Stores the student's name, branch, semester, experience level, and learning goal.

**Course library module:** Displays course information and supports search and filtering.

**Roadmap module:** Organizes suggested courses and uses prerequisite ordering to avoid presenting dependent topics before their foundations.

**Progress module:** Stores enrollment and completion dates and updates the dashboard statistics.

**Course management module:** Allows authorized staff to add courses after validating fields, tracks, and prerequisite references.

### 6. Algorithm

The project uses Kahn's topological sorting algorithm for the prerequisite graph.

1. Count the prerequisites of each course.
2. Add courses with zero prerequisites to a queue.
3. Remove one ready course and add it to the output order.
4. Reduce the prerequisite count of each dependent course.
5. When a dependent course reaches zero, add it to the queue.
6. If not all courses are processed, report a circular dependency.

The algorithm is useful because a course should appear after its required foundation courses. The application also checks for duplicate identifiers, self-dependencies, and missing prerequisite references.

### 7. Technology used

- HTML for page structure.
- CSS for layout, responsive styling, and visual design.
- JavaScript for interface behavior and API communication.
- Node.js and Express for server-side routes.
- SQLite for persistent relational data.
- bcryptjs for password hashing.
- JSON Web Tokens for signed sessions.
- Jest and Supertest for automated tests.

### 8. Security and validation

The project uses server-side validation rather than relying only on browser form checks. SQL statements are parameterized, request bodies have size limits, authentication routes are rate-limited, and role checks protect staff operations. Passwords are stored as hashes rather than plain text. The server validates prerequisite references before adding a course.

### 9. Testing

The automated tests check prerequisite ordering, circular dependencies, duplicate course identifiers, missing prerequisite references, registration validation, duplicate accounts, authentication requirements, role permissions, course creation, and progress tracking.

Manual testing should also cover the full student journey in a browser, including refreshing the page, signing out, and signing back in.

### 10. Limitations

The course catalogue is sample academic content and should be reviewed before being used as an official curriculum. The project is a local prototype and does not include production account recovery, deployment monitoring, or a full institutional approval workflow. The current browser session approach is suitable for a demonstration but should be replaced with a reviewed cookie-based approach for production.

### 11. Future scope

- Allow faculty to review and approve course content.
- Add quizzes and course completion certificates.
- Add learning reminders and weekly goals.
- Add more career tracks and editable roadmap preferences.
- Provide analytics for students and faculty.
- Add deployment, backup, and account recovery features.

### 12. Conclusion

SkillSprout — LearnLoop demonstrates how a learning planner can combine a friendly interface with meaningful backend logic. The project supports course discovery, prerequisite-aware learning, persistent progress, and role-based course management. Its main value is helping students break a larger learning goal into manageable steps.
