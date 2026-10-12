# Tri-Anchor + Hop: Canva slide text and speaker notes

Use these six slides after your UCS slide and before the app demonstration. Allow about 4–5 minutes for this section of the full 10–15 minute presentation. Keep the text under “On the slide” on screen. Put “Say” in Canva's presenter notes. Keep your cream background and navy text. These notes supply content for your existing Canva deck, not an edited Canva design.

## Slide 1: A* with Tri-Anchor + Hop

### On the slide

**Priority: f(n) = g(n) + h(n)**

- g(n): cost of the best route found so far from the start to city n.
- h(n): estimated remaining cost from city n to the goal.
- A* selects the frontier city with the lowest priority.

**Our h combines three landmark bounds with a minimum-hop bound.**

### Say (35 seconds)

“Both UCS and A* use the real cost of each road. UCS compares the cost so far. A* also considers an estimate of the cost still remaining. Our custom heuristic is called Tri-Anchor plus Hop. Tri means three reference cities, and a hop means crossing one road. We combine these sources of information to estimate the remaining distance for any selected destination.”

## Slide 2: Three reference cities

### On the slide

**Anchors: Arad, Neamt, Eforie**

For each anchor L:

**bL(n, goal) = |D(L, n) − D(L, goal)|**

D means the shortest road distance from the anchor.

At Sibiu, with Bucharest as the goal:

**Arad bound = |140 − 418| = 278 km**

### Say (45 seconds)

“We chose three reference cities spread across the map: Arad in the west, Neamt in the northeast, and Eforie in the southeast. At startup, Dijkstra calculates shortest road distances from each anchor to every city. If two cities are 140 and 418 kilometres from the same anchor, they must be at least 278 kilometres apart by road. This comes from the triangle inequality. The anchor is a reference point. Our route does not have to visit it. These three cities are a design choice, and we have not proved they are the best possible anchors.”

## Slide 3: The minimum-hop bound

### On the slide

**Hop = one road between neighboring cities**

**Hop bound = fewest roads to the goal × 70 km**

- BFS counts the fewest roads, ignoring their different lengths.
- Every road in this map is at least 70 km.
- At least 2 roads means at least 140 km remaining.

### Say (40 seconds)

“The second idea is a simpler version of the route problem. Breadth-first search counts the fewest roads needed to reach the goal. Lugoj to Mehadia is the shortest road, at 70 kilometres. We use that as the minimum possible cost of every hop. If every route needs at least two roads, no route can cost less than 140 kilometres. The path with the fewest roads does not necessarily have the smallest total distance.”

## Slide 4: Why the maximum?

### On the slide

**h = max(Arad bound, Neamt bound, Eforie bound, hop bound)**

Zerind to Timisoara:

| Component | Lower bound |
| --- | ---: |
| Each of the three anchors | 43 km |
| Hop count: 2 × 70 | 140 km |
| Combined h | **140 km** |
| Actual shortest distance | 193 km |

**The maximum keeps the strongest lower bound.**

### Say (45 seconds)

“All four values estimate the same remaining journey. We take the largest because it is the strongest information that stays below the true shortest distance. We do not add them, because that could count the same distance more than once. This example shows why we added the hop component: the anchor bounds are only 43 kilometres, while the hop bound improves the estimate to 140. The true cost is 193. The plus sign in our name means we combine the techniques. The actual addition in A* is g plus h.”

## Slide 5: The calculation in our code

### On the slide

From `heuristicFor(goal)` in `search.js` (formatted excerpt):

```js
return Float64Array.from(cities, (_, n) => Math.max(
  minimumEdge * hops[n],
  ...landmarkTables.map(d => Math.abs(d[n] - d[goal]))
));
```

At Sibiu, after the 140 km road from Arad:

**h = max(278, 278, 278, 140) = 278 km**

**Priority = g + h = 140 + 278 = 418 km**

### Say (50 seconds)

“The three distance tables come from Dijkstra, and the hops array comes from BFS for our chosen goal. In this code, Math.abs calculates each landmark difference. Math.max chooses the strongest of those three differences and the hop bound. At Sibiu, all anchor bounds give 278, and the hop bound gives 140. We keep 278, then add the 140 kilometres already in our route to Sibiu. The priority is 418. That estimate happens to be exact here. In general we cannot find h by subtracting g from an earlier priority. The priority can change as we consider different cities.”

Code source: https://github.com/zenm11/AI-Pathfinding/blob/main/romania-lab/dist/search.js

## Slide 6: Correctness and tradeoffs

### On the slide

- **Admissible:** h never exceeds the true shortest remaining cost.
- **Consistent:** h(u) ≤ road cost(u, v) + h(v).
- The maximum preserves both properties, with h(goal) = 0.
- Preparation and stored bounds add time and memory.

**A* can expand fewer cities. Runtime improvement must be measured.**

### Say (50 seconds)

“The landmark bounds follow the triangle inequality. The hop bound follows the minimum road length. Each is admissible and consistent, and taking their maximum preserves those properties. A* can therefore return the optimal cost when it selects the goal from the frontier. The guidance has a cost: we prepare distance tables and store heuristic values. Fewer expansions do not guarantee faster execution, particularly on this small map. We compare measured search time, preparation time, and estimated storage separately. Our custom contribution is the fixed three-anchor choice and its combination with the hop bound. These are established techniques, so we are not claiming to invent A* or a new search algorithm.”

Reference for landmark bounds: Goldberg and Harrelson, *Computing the Shortest Path: A* Search Meets Graph Theory* (2005): https://www.microsoft.com/en-us/research/wp-content/uploads/2005/01/soda05.pdf

## Live demonstration after these slides

1. Select Arad to Bucharest. Step to Sibiu and show g, the four bounds, and priority.
2. Select Zerind to Timisoara. Show that Hop gives 140 km while each anchor gives 43 km.
3. Select Lugoj to Vaslui. Neither endpoint is an anchor. This avoids basing the comparison entirely on a particularly favorable landmark route.
4. Use Measure five routes. Explain actual measured results on your device, including preparation cost and the storage estimate. Never claim “100% faster” from rounded timings.

## Optional answers for questions

**Why can the estimate be exact?** If a landmark lies on an optimal route, the difference of its distances can equal the true remaining cost. For example, the Arad bound at Sibiu with Bucharest as the goal equals 278 km.

**Does the algorithm travel back to the anchor?** No. The anchor distances supply a numerical bound. A* explores roads according to g + h, and the final route follows the selected predecessors.

**Does h change every step?** Each city's h is fixed for a particular goal and map. Selecting a different city means looking up that city's h. Changing the goal requires new hop counts and combined bounds. A better discovered route can change g and therefore priority.

**Why any goal?** Each anchor table contains a distance to every city. The calculation uses the selected goal's entry, and BFS starts at that goal. It is not a table tied only to Bucharest.

**Why three anchors?** They offer several distance perspectives while keeping preparation and storage small. More anchors can strengthen estimates but add overhead. The chosen trio is not proven optimal.

**What happens if roads change?** Recompute the landmark distances, minimum road cost, hop counts, and combined bounds. Our absolute-difference formula assumes undirected roads.

**How did we test it?** Repository tests check all 400 ordered start–goal pairs against Floyd–Warshall and check admissibility and consistency. The website's all-pairs comparison shows agreement between UCS and A*, while the independent oracle is in the tests.

**Why can two hops give a bound for a cheapest route that uses three roads?** At Sibiu, the fewest-road route to Bucharest uses Fagaras (2 roads). The cheapest route uses Rimnicu Vilcea and Pitesti (3 roads). Every route still needs at least 2 roads, so 2 × 70 remains a valid lower bound.
