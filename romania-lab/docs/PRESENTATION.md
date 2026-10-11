# Presentation outline (approximately 12 minutes)

Replace role labels with your 6–7 group members' names. Use actual app results from the recording; do not invent runtime numbers.

1. **0:00–1:15 — Problem and requirements.** Explain states, roads, weights, arbitrary start/goal, and minimizing total distance. Show the deployed app and GitHub link.
2. **1:15–3:00 — Uniform-Cost Search.** Use Arad to Bucharest. Step through the frontier and explain g(n). Explain why finding the goal as a neighbor is not sufficient to stop.
3. **3:00–5:15 — Custom heuristic.** Explain the three landmarks and the minimum-hop bound. Show the live h(n) calculation. Give the triangle-inequality intuition; explain why it works for any destination.
4. **5:15–7:00 — A* demonstration.** Explain f=g+h and compare the explored cities with UCS. Both return 418 km for the canonical example. Describe the tradeoff: guidance requires preparation and storage.
5. **7:00–9:00 — Other city pairs and edge case.** Demonstrate Lugoj to Vaslui (neither is a landmark), reverse a route, and choose the same city twice. Use the slider to inspect a frontier midway through the search.
6. **9:00–10:30 — Performance comparison.** Run the runtime measurement. Explain warm-up, repeated batches, noise, separate preprocessing, peak frontier, and memory estimates. Do not claim a modelled byte estimate is measured browser RAM or that A* always runs faster.
7. **10:30–12:00 — Correctness and wrap-up.** Show `npm test`: every ordered city pair checked against Floyd-Warshall, plus heuristic validity on every edge for every goal. Explain module structure, group contributions, limitations, and potential improvements.

## Questions to practise

- Why is UCS a blind search even though it uses road costs?
- Why is breadth-first search not guaranteed to minimize kilometres?
- What is the difference between an explored city and the frontier?
- Why can't the Bucharest straight-line-distance table serve every destination?
- What do admissible and consistent mean? How is the custom heuristic both?
- Does taking the maximum of lower bounds remain a lower bound?
- Why can A* use more memory even when it expands fewer cities?
- Why is preprocessing not free, and how is it accounted for?
- Is the heuristic a new invention? (No: it is a project-specific combination of established bounds.)
- What would change for directed roads or modified road weights? (Revisit the landmark formula for direction; recompute all preparation when the graph changes.)

## Before recording/submission

Add member names and truthful contributions. Verify the instructor can access both URLs. Record at readable zoom, show several route pairs, upload a 10–15 minute video, and submit the app/video URLs through the course submission form. The app does not submit anything automatically.

## Updated app demonstration

- Start in **Search ready**. No finished route is drawn until you choose **Preview final route** or the search reaches the goal. Preview does not advance the search; **Reset** returns to the start.
- Press **Step** and read the live decision panel next to the map. It shows the chosen city's cost, heuristic and priority, the bound calculations, and the next three frontier cities. The full frontier remains available below the experiments.
- Use **Zerind → Timisoara** from the five-route comparison: at Zerind, landmark bounds are 43 km while the hop bound is 2 × 70 = 140 km. The true optimal cost is 193 km. The hop component therefore strengthens this estimate without overestimating.
- Use **Measure five routes** before recording the comparison. **Download CSV** exports your device's measured results. Search timings are warmed medians; goal preparation is a separate single sample and landmark preparation is a one-time shared cost. Tiny timings can round to 0.0 µs.
- Expand the storage breakdown to explain exact typed-array payloads and the assumed frontier payload. It remains an estimate of retained algorithm data, not measured peak RAM.
- Run **Check all 400 start–destination pairs** to show cost agreement and search-effort counts. Agreement alone is not an independent correctness proof; the repository tests check against Floyd–Warshall. Do not generalize expansion counts into guaranteed runtime savings.
