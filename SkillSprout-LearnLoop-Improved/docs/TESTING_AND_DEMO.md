# Testing and Demonstration Guide

## Automated tests

Run:

```bash
npm test
```

| Test area | Expected result |
|---|---|
| Prerequisite ordering | Foundations appear before dependent courses |
| Circular dependency | Algorithm reports a cycle |
| Duplicate course ID | Algorithm rejects duplicates |
| Unknown prerequisite (strict mode) | Validation reports the missing course |
| Self-prerequisite | Validation rejects the course |
| Weak registration data | API returns `400` |
| Duplicate email | API returns `409` |
| Protected course list | Anonymous request returns `401` |
| Student course creation | API returns `403` |
| Admin course creation | Valid course returns `201` |
| Enrollment before prerequisite completion | API returns `409` |
| Enroll and complete foundation course | API saves progress and returns success |

## Manual acceptance checklist

- [ ] The app opens at the sign-in page.
- [ ] A student can create an account and sign in.
- [ ] Profile changes are saved and shown on the dashboard.
- [ ] Search and difficulty/semester filters work together.
- [ ] Locked courses cannot be enrolled in.
- [ ] Completing a course updates the progress page.
- [ ] Refreshing the page does not erase saved progress.
- [ ] Signing out returns to the sign-in screen.
- [ ] A student cannot access staff-only course management.
- [ ] The layout remains usable at a narrow mobile width.

## Short presentation script

“SkillSprout LearnLoop is a student learning planner. The challenge is not only finding courses, but knowing which course should come first. The roadmap uses prerequisite relationships and topological sorting to suggest a valid order. Students can create a profile, search the catalogue, enroll when they are ready, and track completed courses. The backend stores the progress and checks permissions, so the rules are not only visual. I also included automated tests for the algorithm, access control, and progress workflow.”

Adapt the wording to match your own explanation and what you demonstrate live.
