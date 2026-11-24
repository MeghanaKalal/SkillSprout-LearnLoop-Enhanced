/* SkillSprout LearnLoop — the browser handles the interface; the server owns the data. */
const API = '/api';
const TOKEN_KEY = 'skillsprout_session';
const GOALS = ['Full-Stack Web Development', 'Artificial Intelligence', 'Data Science'];
const PAGE_NAMES = { dashboard: 'Overview', roadmap: 'My roadmap', catalog: 'Course library', progress: 'My progress' };
let token = sessionStorage.getItem(TOKEN_KEY) || '';
let user = null;
let courses = [];
let enrollments = [];
let authMode = 'login';
let toastTimer;
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) signOut(false);
    throw new Error(payload.error || 'Something went wrong. Please try again.');
  }
  return payload;
}
function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
function showAuth(message = '') {
  $('authScreen').hidden = false;
  $('appShell').hidden = true;
  $('authError').textContent = message;
}
function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  $('authHeading').textContent = registering ? 'Start your learning garden.' : 'Welcome back.';
  $('authCopy').textContent = registering ? 'Create an account and build a learning path that feels like yours.' : 'Sign in to continue growing your skills.';
  $('nameField').hidden = !registering;
  $('authName').required = registering;
  $('authPassword').autocomplete = registering ? 'new-password' : 'current-password';
  $('authSubmit').textContent = registering ? 'Create my account →' : 'Sign in →';
  $('authSwitchText').innerHTML = registering ? 'Already have an account? <button type="button" id="authSwitch">Sign in</button>' : 'New to SkillSprout? <button type="button" id="authSwitch">Create an account</button>';
  $('authSwitch').addEventListener('click', () => setAuthMode(registering ? 'login' : 'register'));
  $('authError').textContent = '';
}
async function submitAuth(event) {
  event.preventDefault();
  const button = $('authSubmit');
  button.disabled = true;
  $('authError').textContent = '';
  const body = { email: $('authEmail').value.trim(), password: $('authPassword').value };
  if (authMode === 'register') body.name = $('authName').value.trim();
  try {
    const result = await api(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify(body) });
    token = result.token;
    sessionStorage.setItem(TOKEN_KEY, token);
    user = result.user;
    await enterApp();
    if (authMode === 'register') openProfile();
  } catch (error) { $('authError').textContent = error.message; }
  finally { button.disabled = false; }
}
function signOut(showMessage = true) {
  token = '';
  user = null;
  courses = [];
  enrollments = [];
  sessionStorage.removeItem(TOKEN_KEY);
  showAuth(showMessage ? 'You have signed out safely.' : 'Your session ended. Please sign in again.');
}
async function enterApp() {
  const [me, courseData, progressData] = await Promise.all([api('/auth/me'), api('/courses'), api('/progress')]);
  user = me.user;
  courses = courseData.courses;
  enrollments = progressData.enrollments;
  $('authScreen').hidden = true;
  $('appShell').hidden = false;
  $('roleChip').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  $('courseManager').hidden = !['faculty','admin'].includes(user.role);
  $('todayLabel').textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  renderAll();
  if (!user.name || user.name === 'Student') openProfile();
}
function enrollment(courseId) { return enrollments.find(item => item.courseId === courseId); }
function isCompleted(id) { return Boolean(enrollment(id)?.completedAt); }
function isEnrolled(id) { return Boolean(enrollment(id)); }
function isUnlocked(course) { return course.prerequisites.every(isCompleted); }
function status(course) { return isCompleted(course.id) ? 'Completed' : isEnrolled(course.id) ? 'In progress' : isUnlocked(course) ? 'Ready to start' : 'Locked'; }
function statusClass(value) { return value === 'Completed' ? 'done' : value === 'Locked' ? 'locked' : ''; }
function recommendedCourses() {
  const goal = user?.goal || GOALS[0];
  const relevant = courses.filter(course => course.tracks.includes(goal) || course.semester === 1);
  const ids = new Set(relevant.map(course => course.id));
  const degree = new Map(relevant.map(course => [course.id, 0]));
  const children = new Map(relevant.map(course => [course.id, []]));
  relevant.forEach(course => course.prerequisites.filter(id => ids.has(id)).forEach(id => { degree.set(course.id, degree.get(course.id) + 1); children.get(id).push(course.id); }));
  const queue = relevant.filter(course => degree.get(course.id) === 0).map(course => course.id);
  const result = []; let cursor = 0;
  while (cursor < queue.length) { const id = queue[cursor++]; result.push(relevant.find(course => course.id === id)); children.get(id).forEach(child => { degree.set(child, degree.get(child) - 1); if (!degree.get(child)) queue.push(child); }); }
  return result.length === relevant.length ? result : relevant;
}
function completedCourses() { return courses.filter(course => isCompleted(course.id)); }
function enrolledCourses() { return courses.filter(course => isEnrolled(course.id)); }
function earnedCredits() { return completedCourses().reduce((sum, course) => sum + course.credits, 0); }
function totalCredits() { return enrolledCourses().reduce((sum, course) => sum + course.credits, 0); }
function progressPercent() { const selected = enrolledCourses(); return selected.length ? Math.round(selected.filter(course => isCompleted(course.id)).length / selected.length * 100) : 0; }
function renderIdentity() {
  const name = user?.name || 'Student';
  const initial = name.charAt(0).toUpperCase();
  $('sideName').textContent = name;
  $('sideBranch').textContent = `${user?.branch || 'Your learning space'} · ${user?.role || 'student'}`;
  $('sideAvatar').textContent = initial; $('topAvatar').textContent = initial;
  $('welcomeTitle').textContent = `Good to see you, ${name.split(' ')[0]}.`;
  $('profileSummary').textContent = `${user.branch} · Semester ${user.semester} · ${user.experience}. Your path is shaped around ${user.goal.toLowerCase()}.`;
  $('goalPill').textContent = `🌿 ${user.goal}`; $('roadmapGoal').textContent = user.goal;
}
function renderStats() {
  $('completedCount').textContent = completedCourses().length;
  $('activeCount').textContent = enrolledCourses().filter(course => !isCompleted(course.id)).length;
  $('creditsCount').textContent = earnedCredits(); $('overallPercent').textContent = `${progressPercent()}%`;
}
function renderDashboard() {
  renderIdentity(); renderStats();
  $('dashboardRoadmap').innerHTML = recommendedCourses().slice(0,5).map((course,index) => {
    const value = status(course);
    return `<div class="mini-step"><div class="step-dot">${isCompleted(course.id) ? '✓' : index + 1}</div><div><strong>${escapeHTML(course.title)}</strong><small>${course.id} · ${course.credits} credits</small></div><span class="status ${statusClass(value)}">${value}</span></div>`;
  }).join('');
}
function renderRoadmap() {
  renderIdentity();
  const list = recommendedCourses();
  const done = list.filter(course => isCompleted(course.id)).length;
  $('roadmapPercent').textContent = `${list.length ? Math.round(done/list.length*100) : 0}%`;
  $('roadmapMeta').textContent = `A suggested path for ${user.branch} · courses unlock as prerequisites are completed`;
  $('fullRoadmap').innerHTML = [1,2,3,4,5,6,7,8].map(term => {
    const group = list.filter(course => course.semester === term);
    if (!group.length) return '';
    return `<article class="semester-card"><div class="semester-head"><h3>Semester ${term}</h3><span>${group.length} suggested courses</span></div>${group.map(course => `<div class="road-course"><div class="course-check">${isCompleted(course.id) ? '✓' : '•'}</div><div class="road-course-info"><strong>${escapeHTML(course.title)}</strong><small>${course.id} · ${course.credits} credits · ${course.level}</small></div><span class="status ${statusClass(status(course))}">${status(course)}</span></div>`).join('')}</article>`;
  }).join('');
}
function renderCatalog() {
  const query = ($('courseSearch').value || '').toLowerCase().trim();
  const level = $('difficultyFilter').value; const semester = $('semesterFilter').value;
  const found = courses.filter(course => [course.id,course.title,course.description,...course.skills].join(' ').toLowerCase().includes(query) && (level === 'all' || course.level === level) && (semester === 'all' || String(course.semester) === semester));
  $('courseResultCount').textContent = `Showing ${found.length} of ${courses.length} courses`;
  $('courseGrid').innerHTML = found.length ? found.map(course => {
    const enrolled = isEnrolled(course.id), done = isCompleted(course.id), unlocked = isUnlocked(course);
    const label = done ? 'Completed' : enrolled ? 'Enrolled' : unlocked ? 'Enroll' : 'Locked';
    const tags = course.skills.slice(0,3).map(skill => `<span>${escapeHTML(skill)}</span>`).join('');
    return `<article class="catalog-card"><div class="course-card-top"><span class="course-code">${escapeHTML(course.id)}</span><span class="difficulty">${escapeHTML(course.level)}</span></div><h3>${escapeHTML(course.title)}</h3><p>${escapeHTML(course.description)}</p><div class="course-tags">${tags}</div><div class="card-bottom"><small>Semester ${course.semester} · ${course.credits} credits</small><button class="enroll-button" data-enroll="${escapeHTML(course.id)}" ${done || enrolled || !unlocked ? 'disabled' : ''}>${label}</button></div></article>`;
  }).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>🍃</span>No courses match that search. Try another keyword or filter.</div>';
}
function renderProgress() {
  const selected = enrolledCourses(), finished = completedCourses(), active = selected.filter(course => !isCompleted(course.id));
  const percent = progressPercent(), credits = earnedCredits(), total = totalCredits();
  $('ringPercent').textContent = `${percent}%`;
  $('progressRing').style.background = `conic-gradient(#6e9369 ${percent*3.6}deg, #e9eee5 0deg)`;
  $('earnedCredits').textContent = credits; $('totalCredits').textContent = total;
  $('creditBar').style.width = `${total ? credits/total*100 : 0}%`;
  $('progressCompleted').textContent = finished.length; $('progressActive').textContent = active.length;
  $('progressHeadline').textContent = percent === 100 && selected.length ? 'Look at you — path completed!' : percent > 0 ? "You're finding your rhythm." : 'Your story is just beginning.';
  $('progressMessage').textContent = selected.length ? `You've completed ${finished.length} of ${selected.length} enrolled courses. Keep taking it one step at a time.` : 'Enroll in a course and take your first step. We will keep track as you go.';
  $('progressCourseList').innerHTML = selected.length ? selected.map(course => `<div class="progress-course-row"><div class="step-dot">${isCompleted(course.id) ? '✓' : '↗'}</div><div><strong>${escapeHTML(course.title)}</strong><small>${course.id} · ${course.credits} credits</small></div>${isCompleted(course.id) ? '<span class="status done">Completed</span>' : `<button class="enroll-button" data-complete="${escapeHTML(course.id)}">Mark complete</button>`}</div>`).join('') : '<div class="empty-state"><span>🌱</span>You have not enrolled in a course yet.<br>Visit the course library to choose your first one.</div>';
}
function renderAll() { renderDashboard(); renderRoadmap(); renderCatalog(); renderProgress(); }
function setView(view) {
  document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('pageName').textContent = PAGE_NAMES[view] || 'Overview'; $('sidebar').classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'});
}
async function refreshProgress() { const result = await api('/progress'); enrollments = result.enrollments; renderAll(); }
async function enrollCourse(id) {
  try { await api(`/progress/${encodeURIComponent(id)}/enroll`, {method:'POST',body:'{}'}); await refreshProgress(); toast('Course added to your learning list. 🌱'); }
  catch (error) { toast(error.message); }
}
async function completeCourse(id) {
  try { await api(`/progress/${encodeURIComponent(id)}/complete`, {method:'POST',body:'{}'}); await refreshProgress(); toast('Nice work! Course marked as complete. 🌿'); }
  catch (error) { toast(error.message); }
}
function openProfile() {
  $('studentName').value = user?.name || ''; $('branch').value = user?.branch || 'CSE';
  $('semester').value = String(user?.semester || 1); $('experience').value = user?.experience || 'New to coding';
  $('goal').value = user?.goal === 'Not sure yet' ? 'Not sure yet' : user?.goal || GOALS[0];
  $('onboardingModal').classList.add('open');
}
function closeProfile() { $('onboardingModal').classList.remove('open'); }
async function saveProfile(form) {
  const data = new FormData(form);
  const body = Object.fromEntries(['name','branch','semester','experience','goal'].map(key => [key, data.get(key)]));
  body.semester = Number(body.semester);
  try { const result = await api('/auth/profile',{method:'PATCH',body:JSON.stringify(body)}); user = result.user; closeProfile(); renderAll(); toast('Your learning path has been updated. 🌱'); }
  catch (error) { toast(error.message); }
}

async function createCourse(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const body = {
    id: String(data.get('id')).trim().toUpperCase(), title: String(data.get('title')).trim(),
    credits: Number(data.get('credits')), level: data.get('level'), semester: Number(data.get('semester')),
    skills: String(data.get('skills')).split(',').map(value => value.trim()).filter(Boolean),
    description: String(data.get('description')).trim(),
    prerequisites: String(data.get('prerequisites')).split(',').map(value => value.trim().toUpperCase()).filter(Boolean),
    tracks: data.getAll('tracks')
  };
  try {
    await api('/courses', { method: 'POST', body: JSON.stringify(body) });
    courses = (await api('/courses')).courses;
    form.reset(); $('managerMessage').textContent = 'Course saved. It is now part of the course library.';
    renderAll();
  } catch (error) { $('managerMessage').textContent = error.message; }
}

function wireEvents() {
  $('authForm').addEventListener('submit', submitAuth);
  $('authSwitch').addEventListener('click', () => setAuthMode('register'));
  $('logoutButton').addEventListener('click', () => signOut(true));
  document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => setView(button.dataset.go)));
  $('courseSearch').addEventListener('input', renderCatalog); $('difficultyFilter').addEventListener('change', renderCatalog); $('semesterFilter').addEventListener('change', renderCatalog);
  $('courseGrid').addEventListener('click', event => { const button = event.target.closest('[data-enroll]'); if (button) enrollCourse(button.dataset.enroll); });
  $('progressCourseList').addEventListener('click', event => { const button = event.target.closest('[data-complete]'); if (button) completeCourse(button.dataset.complete); });
  $('profileForm').addEventListener('submit', event => { event.preventDefault(); saveProfile(event.target); });
  $('closeModal').addEventListener('click', closeProfile); $('skipOnboarding').addEventListener('click', closeProfile);
  $('updateProfile').addEventListener('click', openProfile); $('editProfile').addEventListener('click', openProfile);
  $('onboardingModal').addEventListener('click', event => { if (event.target.id === 'onboardingModal') closeProfile(); });
  $('mobileMenu').addEventListener('click', () => $('sidebar').classList.toggle('open'));
  $('courseManagerForm').addEventListener('submit', createCourse);
}
async function boot() {
  wireEvents(); setAuthMode('login');
  if (!token) return showAuth();
  try { await enterApp(); } catch { signOut(false); }
}
document.addEventListener('DOMContentLoaded', boot);
