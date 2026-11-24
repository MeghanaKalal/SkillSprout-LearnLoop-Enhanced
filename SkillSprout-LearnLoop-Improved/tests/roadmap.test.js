const { topologicalSort } = require('../backend/services/roadmap');
describe('Kahn topological sort', () => {
  test('places every prerequisite before the course that depends on it', () => {
    const courses = [
      { id: 'C', prerequisites: ['B'] },
      { id: 'A', prerequisites: [] },
      { id: 'B', prerequisites: ['A'] }
    ];
    const result = topologicalSort(courses).map(course => course.id);
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
    expect(result.indexOf('B')).toBeLessThan(result.indexOf('C'));
  });
  test('reports circular prerequisites instead of returning a broken path', () => {
    expect(() => topologicalSort([
      { id: 'A', prerequisites: ['B'] },
      { id: 'B', prerequisites: ['A'] }
    ])).toThrow(/circular prerequisite/i);
  });
  test('rejects duplicate course identifiers', () => {
    expect(() => topologicalSort([{id:'A',prerequisites:[]},{id:'A',prerequisites:[]}])).toThrow(/duplicate/i);
  });
  test('ignores a prerequisite outside the selected course list', () => {
    expect(topologicalSort([{id:'B',prerequisites:['NOT_IN_LIST']}])).toHaveLength(1);
  });
});

describe('Strict prerequisite validation', () => {
  test('reports a prerequisite that is missing from a complete course map', () => {
    expect(() => topologicalSort(
      [{ id: 'WD501', prerequisites: ['MISSING'] }],
      { strictPrerequisites: true }
    )).toThrow(/unknown prerequisite/i);
  });
  test('rejects a course that lists itself as a prerequisite', () => {
    expect(() => topologicalSort(
      [{ id: 'SELF1', prerequisites: ['SELF1'] }],
      { strictPrerequisites: true }
    )).toThrow(/cannot require itself/i);
  });
});
