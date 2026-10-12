import test from 'node:test';
import assert from 'node:assert/strict';
import { cities, roads, graph, search, heuristicFor, benchmark } from '../dist/search.js';

const n = cities.length;
const oracle = Array.from({ length: n }, (_, i) =>
  Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
);
for (const { a, b, cost } of roads) {
  oracle[a][b] = oracle[b][a] = cost;
}
for (let k = 0; k < n; k++) {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      oracle[i][j] = Math.min(oracle[i][j], oracle[i][k] + oracle[k][j]);
    }
  }
}
test('assignment map: 20 cities, 23 unique positive undirected roads', () => {
  assert.equal(cities.length, 20);
  assert.equal(roads.length, 23);
  assert.equal(
    new Set(roads.map((e) => [e.a, e.b].sort((a, b) => a - b).join('-'))).size,
    23,
  );
  for (const e of roads) {
    assert(e.cost > 0);
    assert(graph[e.a].some((x) => x.id === e.b && x.cost === e.cost));
    assert(graph[e.b].some((x) => x.id === e.a && x.cost === e.cost));
  }
});
test('UCS and A* match the independent oracle for all 400 ordered city pairs', () => {
  for (let s = 0; s < n; s++) {
    for (let g = 0; g < n; g++) {
      for (const a of ['ucs', 'astar']) {
        const r = search(s, g, a);
        assert.equal(
          r.cost,
          oracle[s][g],
          `${a}: ${cities[s].name} to ${cities[g].name}`,
        );
        assert.equal(r.path[0], s);
        assert.equal(r.path.at(-1), g);
        assert.equal(new Set(r.path).size, r.path.length);
        let total = 0;
        for (let i = 1; i < r.path.length; i++) {
          const e = graph[r.path[i - 1]].find((e) => e.id === r.path[i]);
          assert(e);
          total += e.cost;
        }
        assert.equal(total, r.cost);
        assert.equal(r.steps.at(-1).done, true);
        assert.deepEqual(r.steps.at(-1).path, r.path);
        assert.equal(
          r.peakFrontier,
          Math.max(1, ...r.steps.map((s) => s.frontier.length)),
        );
        assert.equal(
          r.peakStored,
          Math.max(1, ...r.steps.map((s) => s.frontier.length + s.explored.length)),
        );
        assert.equal(r.expanded, r.steps.length - 1);
      }
    }
  }
});
test('heuristic is nonnegative, admissible, zero at the goal, and consistent for every goal and road', () => {
  for (let g = 0; g < n; g++) {
    const h = heuristicFor(g);
    assert.equal(h[g], 0);
    for (let u = 0; u < n; u++) {
      assert(h[u] >= 0);
      assert(h[u] <= oracle[u][g]);
    }
    for (const e of roads) {
      assert(h[e.a] <= e.cost + h[e.b]);
      assert(h[e.b] <= e.cost + h[e.a]);
    }
  }
});
test('canonical route is 418 km; start equals goal has zero travel and expansion', () => {
  for (const a of ['ucs', 'astar']) {
    const r = search(0, 12, a);
    assert.equal(r.cost, 418);
    assert.deepEqual(
      r.path.map((i) => cities[i].name),
      ['Arad', 'Sibiu', 'Rimnicu Vilcea', 'Pitesti', 'Bucharest'],
    );
  }
  for (let i = 0; i < n; i++) {
    for (const a of ['ucs', 'astar']) {
      const r = search(i, i, a);
      assert.equal(r.cost, 0);
      assert.equal(r.expanded, 0);
      assert.deepEqual(r.path, [i]);
    }
  }
});
test('invalid city and algorithm inputs fail intentionally', () => {
  for (const id of [-1, 20, NaN, 0.5, 'Arad']) {
    assert.throws(() => search(id, 12));
  }
  assert.throws(() => search(0, 99));
  assert.throws(() => search(0, 12, 'bfs'));
  assert.throws(() => heuristicFor(-1));
});
test('timed execution omits traces without changing results; timing samples are finite', () => {
  const r = search(0, 12, 'astar', { trace: false });
  assert.equal(r.cost, 418);
  assert.equal(r.steps.length, 0);
  const b = benchmark(0, 12, { batches: 3, runs: 5 });
  for (const key of ['ucs', 'astar', 'goalSetupMs', 'landmarkSetupMs']) {
    assert(Number.isFinite(b[key]) && b[key] >= 0);
  }
});
