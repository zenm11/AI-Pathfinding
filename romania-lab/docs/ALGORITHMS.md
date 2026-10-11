# Understanding and defending the implementation

## Problem formulation

- State: one of the 20 cities.
- Initial state: the selected starting city.
- Actions: travel along a listed road to a neighboring city.
- Transition: the neighboring city becomes the current state.
- Goal test: current city equals the selected destination.
- Step cost: the road's distance in kilometres.
- Objective: minimize total path cost.

The map is undirected and connected, with positive costs. Selecting the same start and destination is valid and returns one city, zero roads, zero cost, and zero expanded cities.

## UCS

Maintain a frontier, best known cost for each city, predecessor, and explored flags. Select the frontier city with the smallest `g`. If it is the goal, reconstruct the path. Otherwise relax each outgoing road: replace a neighbor's known cost only when the candidate is smaller. Positive road costs ensure that the goal is optimal when removed from the frontier, not merely when first discovered.

## A* and the custom heuristic

The search loop is shared with UCS. Only priority changes to `g+h`. Sharing this loop keeps tie-breaking, instrumentation, and frontier implementation identical.

For an undirected shortest-path metric D, the triangle inequality gives:

```
D(L,n) <= D(L,t) + D(t,n)
D(L,t) <= D(L,n) + D(n,t)
|D(L,n)-D(L,t)| <= D(n,t)
```

This supplies an admissible lower bound for every landmark. Across a road (u,v) of weight w, the landmark bound changes by at most w, so it is consistent.

For minimum hop distance H to the goal, `H(u) <= 1+H(v)`. Therefore `70 H(u) <= 70+70 H(v) <= w(u,v)+70 H(v)`, because every road is at least 70 km. It too is consistent and zero at the goal. The maximum of consistent bounds is consistent, so the combination is admissible and safe for A*.

Arad, Neamt, and Eforie sample the western, northeastern, and southeastern extremities of the graph. These are a fixed design choice, not fitted to each query. The triangle inequality is valid for any choice of landmarks; selection affects informativeness rather than correctness. On routes to or from a landmark, a landmark bound can equal the exact remaining distance. Discuss this when comparing examples; do not rely exclusively on the default Arad route to argue general performance.

The implementation uses three Dijkstra preparations and a per-goal BFS plus bound computation. It does not precompute all-pairs optimal routes and call that a heuristic. The independent all-pairs oracle exists only in the tests.

## Complexity for this implementation

For V cities and E undirected roads, the fixed graph uses O(V+E) storage. With consistent heuristics, each node is selected at most once. Sorting an array frontier each iteration takes up to O(V^2 log V); linear membership checks during relaxation add an O(EV) upper bound. Core search storage is O(V), excluding traces. A binary heap is unnecessary for this small teaching graph, but would be appropriate at scale.

Landmark preparation with L=3 and a simple Dijkstra implementation takes O(L(V^2+E)) time and O(LV) retained distance storage. Goal hop preparation takes O(V+E), followed by O(LV) bound calculation. Retained goal heuristic storage is O(V). Trace history copies frontier and explored state at each selection, so it can use O(V^2) space; tracing is disabled in benchmarks and excluded from the search-memory model.

## Honest interpretation

UCS and admissible A* should return the same optimal cost, though equally optimal routes can differ. A* may expand fewer cities but can take more time or storage. Precomputation is a real cost. Timings on 20 nodes are noisy. The app reports storage estimates and node counts, not actual browser heap usage. If the instructor requires measured byte-level allocation, add a controlled profiler experiment and report its methodology separately.

## Source context

The graph is transcribed from page 2 of the user-provided AI Assignment 1-2026 (50%).pdf. Course Lecture 03 covers UCS; Lecture 04 covers heuristic search and A*. The course textbook is Russell and Norvig, Artificial Intelligence: A Modern Approach. Landmark distance bounds are an established technique (often associated with ALT); this project combines them with a relaxed hop bound. No claim of algorithmic novelty is made.
