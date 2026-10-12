export const cities = [
  ['Arad', 110, 225],
  ['Zerind', 140, 133],
  ['Oradea', 190, 65],
  ['Sibiu', 300, 270],
  ['Timisoara', 100, 360],
  ['Lugoj', 210, 420],
  ['Mehadia', 225, 500],
  ['Drobeta', 205, 580],
  ['Craiova', 370, 600],
  ['Rimnicu Vilcea', 380, 370],
  ['Fagaras', 480, 270],
  ['Pitesti', 490, 465],
  ['Bucharest', 625, 545],
  ['Giurgiu', 595, 635],
  ['Urziceni', 720, 485],
  ['Hirsova', 855, 480],
  ['Eforie', 900, 600],
  ['Vaslui', 815, 305],
  ['Iasi', 755, 190],
  ['Neamt', 640, 100],
].map(([name, x, y], id) => ({ id, name, x, y }));

export const roads = [
  ['Arad', 'Zerind', 75],
  ['Arad', 'Sibiu', 140],
  ['Arad', 'Timisoara', 118],
  ['Zerind', 'Oradea', 71],
  ['Oradea', 'Sibiu', 151],
  ['Timisoara', 'Lugoj', 111],
  ['Lugoj', 'Mehadia', 70],
  ['Mehadia', 'Drobeta', 75],
  ['Drobeta', 'Craiova', 120],
  ['Craiova', 'Rimnicu Vilcea', 146],
  ['Craiova', 'Pitesti', 138],
  ['Sibiu', 'Rimnicu Vilcea', 80],
  ['Sibiu', 'Fagaras', 99],
  ['Rimnicu Vilcea', 'Pitesti', 97],
  ['Fagaras', 'Bucharest', 211],
  ['Pitesti', 'Bucharest', 101],
  ['Bucharest', 'Giurgiu', 90],
  ['Bucharest', 'Urziceni', 85],
  ['Urziceni', 'Hirsova', 98],
  ['Hirsova', 'Eforie', 86],
  ['Urziceni', 'Vaslui', 142],
  ['Vaslui', 'Iasi', 92],
  ['Iasi', 'Neamt', 87],
].map(([a, b, cost]) => ({
  a: cities.findIndex((c) => c.name === a),
  b: cities.findIndex((c) => c.name === b),
  cost,
}));

export const graph = cities.map((c) =>
  roads.flatMap((e) =>
    e.a === c.id
      ? [{ id: e.b, cost: e.cost }]
      : e.b === c.id
        ? [{ id: e.a, cost: e.cost }]
        : [],
  ),
);

export const landmarkNames = ['Arad', 'Neamt', 'Eforie'];
const minimumEdge = Math.min(...roads.map((e) => e.cost));

function distances(source) {
  const d = new Float64Array(cities.length).fill(Infinity),
    seen = new Set();
  d[source] = 0;
  while (seen.size < cities.length) {
    let u = -1;
    for (let i = 0; i < d.length; i++) {
      if (!seen.has(i) && (u === -1 || d[i] < d[u])) {
        u = i;
      }
    }
    if (u === -1 || !Number.isFinite(d[u])) {
      break;
    }
    seen.add(u);
    for (const e of graph[u]) {
      d[e.id] = Math.min(d[e.id], d[u] + e.cost);
    }
  }
  return d;
}

const prepStart = performance.now();
export const landmarkTables = landmarkNames.map((name) =>
  distances(cities.findIndex((c) => c.name === name)),
);
export const landmarkSetupMs = performance.now() - prepStart;
export const landmarkBytes = landmarkTables.reduce((sum, t) => sum + t.byteLength, 0);

export function heuristicFor(goal) {
  validateCity(goal);

  const hops = new Int16Array(cities.length).fill(-1);
  hops[goal] = 0;
  const q = [goal];
  for (let i = 0; i < q.length; i++) {
    for (const e of graph[q[i]]) {
      if (hops[e.id] === -1) {
        hops[e.id] = hops[q[i]] + 1;
        q.push(e.id);
      }
    }
  }

  return Float64Array.from(cities, (_, n) =>
    Math.max(
      minimumEdge * hops[n],
      ...landmarkTables.map((d) => Math.abs(d[n] - d[goal])),
    ),
  );
}

export function heuristicParts(node, goal) {
  const h = heuristicFor(goal);
  const q = [goal],
    hop = new Map([[goal, 0]]);
  for (let i = 0; i < q.length; i++) {
    for (const e of graph[q[i]]) {
      if (!hop.has(e.id)) {
        hop.set(e.id, hop.get(q[i]) + 1);
        q.push(e.id);
      }
    }
  }
  return {
    landmarks: landmarkTables.map((d, i) => ({
      name: landmarkNames[i],
      toNode: d[node],
      toGoal: d[goal],
      bound: Math.abs(d[node] - d[goal]),
    })),
    hopBound: minimumEdge * hop.get(node),
    h: h[node],
  };
}

export function validateCity(id) {
  if (!Number.isInteger(id) || id < 0 || id >= cities.length) {
    throw new Error('Choose a valid city.');
  }
}

export function search(
  start,
  goal,
  algorithm = 'ucs',
  { trace = true, heuristic = null } = {},
) {
  validateCity(start);
  validateCity(goal);
  if (!['ucs', 'astar'].includes(algorithm)) {
    throw new Error('Unknown search algorithm.');
  }
  const h = algorithm === 'astar' ? heuristic || heuristicFor(goal) : null;
  const g = new Float64Array(cities.length).fill(Infinity),
    parent = new Int16Array(cities.length).fill(-1),
    closed = new Uint8Array(cities.length);
  const frontier = [start],
    steps = [];
  g[start] = 0;
  let expanded = 0,
    generated = 1,
    peakFrontier = 1,
    peakStored = 1;
  const f = (n) => g[n] + (h?.[n] || 0);

  const order = (a, b) => f(a) - f(b) || cities[a].name.localeCompare(cities[b].name);
  const pathTo = (n) => {
    const path = [];
    for (let p = n; p !== -1; p = parent[p]) {
      path.push(p);
    }
    return path.reverse();
  };
  while (frontier.length) {
    frontier.sort(order);

    const current = frontier.shift();
    closed[current] = 1;
    const done = current === goal;
    if (!done) {
      expanded++;
      for (const edge of graph[current]) {
        const candidate = g[current] + edge.cost;
        if (candidate < g[edge.id]) {
          if (!Number.isFinite(g[edge.id])) {
            generated++;
          }
          g[edge.id] = candidate;
          parent[edge.id] = current;
          closed[edge.id] = 0;
          if (!frontier.includes(edge.id)) {
            frontier.push(edge.id);
          }
        }
      }
    }
    frontier.sort(order);
    peakFrontier = Math.max(peakFrontier, frontier.length);
    peakStored = Math.max(
      peakStored,
      frontier.length + closed.reduce((a, b) => a + b, 0),
    );

    if (trace) {
      steps.push({
        current,
        done,
        cost: g[current],
        path: pathTo(current),
        explored: cities.filter((c) => closed[c.id]).map((c) => c.id),
        frontier: frontier.map((id) => ({ id, g: g[id], h: h?.[id] || 0, f: f(id) })),
      });
    }
    if (done) {
      return {
        algorithm,
        start,
        goal,
        path: pathTo(goal),
        cost: g[goal],
        expanded,
        generated,
        peakFrontier,
        peakStored,
        steps,
        searchBytes:
          g.byteLength + parent.byteLength + closed.byteLength + 8 * peakFrontier,
        heuristicBytes: h ? h.byteLength + landmarkBytes : 0,
      };
    }
  }
  return {
    algorithm,
    start,
    goal,
    path: [],
    cost: Infinity,
    expanded,
    generated,
    peakFrontier,
    peakStored,
    steps,
    searchBytes: g.byteLength + parent.byteLength + closed.byteLength + 8 * peakFrontier,
    heuristicBytes: h ? h.byteLength + landmarkBytes : 0,
  };
}

export function benchmark(start, goal, { batches = 15, runs = 100 } = {}) {
  validateCity(start);
  validateCity(goal);
  const setupStart = performance.now(),
    heuristic = heuristicFor(goal),
    goalSetupMs = performance.now() - setupStart;
  for (let i = 0; i < 100; i++) {
    search(start, goal, 'ucs', { trace: false });
    search(start, goal, 'astar', { trace: false, heuristic });
  }
  const samples = { ucs: [], astar: [] };
  for (let b = 0; b < batches; b++) {
    for (const a of b % 2 ? ['astar', 'ucs'] : ['ucs', 'astar']) {
      const t = performance.now();
      for (let r = 0; r < runs; r++) {
        search(start, goal, a, { trace: false, heuristic });
      }
      samples[a].push((performance.now() - t) / runs);
    }
  }
  const median = (values) =>
    [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  return {
    ucs: median(samples.ucs),
    astar: median(samples.astar),
    goalSetupMs,
    landmarkSetupMs,
    batches,
    runs,
  };
}
