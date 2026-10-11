# Romania Search Lab

An introductory AI course project: compare **Uniform-Cost Search** with **A\*** using a custom **Tri-anchor + hop** heuristic on the assignment's 20-city, 23-road Romania graph.

## Run locally

Requires Node.js 18 or later. No dependencies or installation are needed.

```sh
npm start
```

Open http://127.0.0.1:4173. Run verification with `npm test` and syntax checks with `npm run check`.

## Features

- Any of the 20 cities can be the start or goal, including the same city.
- Weighted, undirected roads faithfully transcribed from the assignment map.
- UCS and A* route comparison, distance, expanded cities, peak frontier and stored cities.
- Play, pause, step, scrub, and speed controls with frontier g/h/f values.
- Real browser runtime benchmarking, separate from animation and tracing.
- Explicit memory accounting model, including A* heuristic tables.
- Responsive map and controls; keyboard-accessible inputs; no API keys or external services.
- Explanation of the heuristic, its assumptions, and optimality conditions.

## Algorithms

UCS orders its frontier by `g(n)`, the road cost from the start. A* orders by `g(n) + h(n, goal)`. Both break ties alphabetically by city name. A small sorted array is intentionally used for the frontier: it is transparent and adequate for 20 cities. This is not a heap-based large-graph performance claim.

Let `D(L,x)` be the shortest road distance from landmark `L` to city `x`. Fixed landmarks are Arad, Neamt, and Eforie. Let `hops(n,t)` be the fewest road edges from `n` to destination `t`, ignoring weights. The shortest edge is 70 km.

```
h(n,t) = max(
  |D(Arad,n) - D(Arad,t)|,
  |D(Neamt,n) - D(Neamt,t)|,
  |D(Eforie,n) - D(Eforie,t)|,
  70 * hops(n,t)
)
```

Landmark bounds follow the triangle inequality. The hop bound follows because each necessary edge costs at least 70 km. Each component is admissible and consistent, and taking their maximum preserves both properties. Thus A* retains optimality for every destination. Coordinates are schematic and never used as geographic distances.

This is a custom **combination of established techniques**, not an invented search algorithm. Landmark shortest paths are prepared by Dijkstra's algorithm; goal hop distances are prepared by BFS. Their storage and preparation costs are disclosed. See `docs/ALGORITHMS.md` for derivation and complexity.

## Verification

`npm test` checks both algorithms for all **400 ordered start/goal pairs** (800 search results) against an independent Floyd-Warshall oracle. It checks route edges/costs, all 20 start=goal cases, every heuristic admissibility and consistency condition, trace metrics, invalid inputs, and the 418 km Arad–Bucharest example.

## Measurement limitations

Runtime is the median per-search time across 15 batches of 100 searches after 100 warm-up runs per algorithm. Batch execution order alternates. Visualization and tracing are excluded. Shared landmark preparation and per-goal heuristic preparation are shown separately. Results depend on the browser, clock resolution, and load; A* is not promised to be faster on a graph this small.

Memory is a **logical payload estimate**, not measured JavaScript heap or RAM: cost/parent/closed typed arrays occupy 220 bytes, plus an assumed 8-byte numeric payload per peak frontier entry. A* adds 480 bytes of landmark tables and 160 bytes of per-goal heuristic values. This excludes object overhead, map data, temporary preprocessing allocations, and animation traces. Peak frontier and stored-city counts provide implementation-independent comparisons. Do not describe the estimate as actual measured memory in the presentation.

## Files

- `dist/search.js`: graph, algorithms, heuristic, benchmark.
- `dist/app.js`: UI state, playback, SVG map, result panels.
- `dist/index.html`, `dist/styles.css`: interface and methodology.
- `dist/config.js`: GitHub repository URL.
- `tests/search.test.mjs`: independent correctness checks.
- `docs/PRESENTATION.md`: 10–15 minute demonstration outline.

## Deployment

The `dist` directory is a complete static site. It works on Sites, GitHub Pages, or any static host. The Sites manifest is in `.openai/hosting.json`; Sites hosting does not replace the assignment's requirement for a GitHub repository.

The parent repository includes GitHub Actions verification and Pages publishing workflows. Enable **Settings → Pages → Source → GitHub Actions** once. Changes pushed to `main` then run the checks and publish `romania-lab/dist`. The previous Sites deployment is separate and does not update when GitHub Pages publishes.

## Course checklist

- [x] Web application; arbitrary start and goal.
- [x] One blind search and one custom heuristic search.
- [x] Cost, runtime, and explicitly labeled memory-model comparison.
- [x] Creative visualization and explainable heuristic.
- [ ] Confirm the final deployed URL is accessible to the instructor.
- [ ] Confirm the GitHub link in the app resolves to the uploaded source.
- [ ] Add group members and record/upload the 10–15 minute presentation.
- [ ] Submit the web app and YouTube URLs by October 13, 2026, at 9 AM.

Course requirements were read from the user-provided assignment and syllabus. Course PDFs and lecture slides are not redistributed in this repository.
