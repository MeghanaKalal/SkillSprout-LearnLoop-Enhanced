/** Kahn's topological sort. Prerequisite edges point from prerequisite to course. */
function topologicalSort(courses, options = {}) {
  if (!Array.isArray(courses)) throw new TypeError('Courses must be an array.');
  const byId = new Map();
  for (const course of courses) {
    if (!course || typeof course.id !== 'string' || !course.id.trim()) throw new Error('Every course needs a valid id.');
    if (byId.has(course.id)) throw new Error(`Duplicate course id: ${course.id}`);
    byId.set(course.id, course);
  }
  const indegree = new Map([...byId.keys()].map(id => [id, 0]));
  const dependents = new Map([...byId.keys()].map(id => [id, []]));
  for (const course of courses) {
    const prereqs = Array.isArray(course.prerequisites) ? course.prerequisites : [];
    for (const prereqId of new Set(prereqs)) {
      if (prereqId === course.id) throw new Error(`Course ${course.id} cannot require itself.`);
      if (!byId.has(prereqId)) {
        if (options.strictPrerequisites) throw new Error(`Course ${course.id} requires unknown prerequisite ${prereqId}.`);
        continue;
      }
      indegree.set(course.id, indegree.get(course.id) + 1);
      dependents.get(prereqId).push(course.id);
    }
  }
  const ready = courses.filter(course => indegree.get(course.id) === 0).map(course => course.id);
  const ordered = [];
  let head = 0;
  while (head < ready.length) {
    const id = ready[head++];
    ordered.push(byId.get(id));
    for (const childId of dependents.get(id)) {
      indegree.set(childId, indegree.get(childId) - 1);
      if (indegree.get(childId) === 0) ready.push(childId);
    }
  }
  if (ordered.length !== courses.length) throw new Error('A circular prerequisite was found in the course data.');
  return ordered;
}
module.exports = { topologicalSort };
