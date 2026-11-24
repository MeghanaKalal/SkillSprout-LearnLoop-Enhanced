process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-jwt-signing';
process.env.DATABASE_FILE = ':memory:';
process.env.ADMIN_NAME = 'Test Admin';
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'AdminPassword123!';
const request = require('supertest');
const app = require('../backend/app');
const db = require('../backend/database/db');
let studentToken;
let adminToken;

beforeAll(async () => {
  const student = await request(app).post('/api/auth/register').send({name:'Test Student',email:'student@test.local',password:'StudentPass123'});
  studentToken = student.body.token;
  const admin = await request(app).post('/api/auth/login').send({email:'admin@test.local',password:'AdminPassword123!'});
  adminToken = admin.body.token;
});
afterAll(() => db.close());

describe('Authentication and authorization', () => {
  test('rejects weak registration data', async () => {
    const response = await request(app).post('/api/auth/register').send({name:'A',email:'wrong',password:'123'});
    expect(response.status).toBe(400);
  });
  test('prevents duplicate email accounts', async () => {
    const response = await request(app).post('/api/auth/register').send({name:'Another Student',email:'STUDENT@test.local',password:'StudentPass456'});
    expect(response.status).toBe(409);
  });
  test('requires authentication for course data', async () => {
    const response = await request(app).get('/api/courses');
    expect(response.status).toBe(401);
  });
  test('student cannot create a course', async () => {
    const response = await request(app).post('/api/courses').set('Authorization',`Bearer ${studentToken}`).send({});
    expect(response.status).toBe(403);
  });
  test('admin cannot create a course with an unknown prerequisite', async () => {
    const response = await request(app).post('/api/courses').set('Authorization',`Bearer ${adminToken}`).send({
      id:'TST901', title:'Dependency Check', credits:2, level:'Beginner', semester:1,
      skills:['Planning'], description:'A small course for validating dependencies.',
      prerequisites:['MISSING999'], tracks:['Full-Stack Web Development']
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/prerequisite/i);
  });
  test('admin can create a well-formed course', async () => {
    const response = await request(app).post('/api/courses').set('Authorization',`Bearer ${adminToken}`).send({id:'TST900',title:'Testing Foundations',credits:2,level:'Beginner',semester:1,skills:['Testing'],description:'Learn how to test software safely.',prerequisites:[],tracks:['Data Science']});
    expect(response.status).toBe(201);
    expect(response.body.course.id).toBe('TST900');
  });
});

describe('Learning progress', () => {
  test('blocks enrollment until all prerequisites are completed', async () => {
    const response = await request(app).post('/api/progress/WD201/enroll').set('Authorization',`Bearer ${studentToken}`).send({});
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/prerequisites/i);
  });
  test('allows enrollment and completion for a foundation course', async () => {
    const headers = { Authorization: `Bearer ${studentToken}` };
    const enroll = await request(app).post('/api/progress/CS101/enroll').set(headers).send({});
    expect(enroll.status).toBe(201);
    const complete = await request(app).post('/api/progress/CS101/complete').set(headers).send({});
    expect(complete.status).toBe(200);
    const progress = await request(app).get('/api/progress').set(headers);
    expect(progress.body.enrollments.find(item => item.courseId === 'CS101').completedAt).toBeTruthy();
  });
});
