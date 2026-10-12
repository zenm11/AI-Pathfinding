import { cities, search, heuristicParts } from './search.js';

export const examples = [
  { start: 'Arad', goal: 'Bucharest', reason: 'Classic route' },
  { start: 'Lugoj', goal: 'Vaslui', reason: 'Neither endpoint is a landmark' },
  { start: 'Zerind', goal: 'Timisoara', reason: 'Hop bound strengthens the estimate' },
  { start: 'Bucharest', goal: 'Arad', reason: 'Reverse direction' },
  { start: 'Sibiu', goal: 'Sibiu', reason: 'Already at the goal' },
];

export function exampleIds(example) {
  return [example.start, example.goal].map(
    (name) => cities.find((c) => c.name === name).id,
  );
}

export function storageBreakdown(result) {
  return {
    costs: cities.length * 8,
    parents: cities.length * 2,
    flags: cities.length,
    frontier: result.peakFrontier * 8,
    heuristic: result.algorithm === 'astar' ? cities.length * 8 : 0,
    landmarks: result.heuristicBytes ? result.heuristicBytes - cities.length * 8 : 0,
  };
}

export function decisionAt(result, index) {
  const city = (id) => cities[id].name;
  if (index < 0) {
    return {
      title: 'Ready to explore',
      text: `Start at ${city(result.start)}. Press Play or Step to see which city is selected and why.`,
      node: result.start,
      g: 0,
      h: result.algorithm === 'astar' ? heuristicParts(result.start, result.goal).h : 0,
    };
  }
  const step = result.steps[index];
  const before = index
    ? result.steps[index - 1].frontier
    : [
        {
          id: result.start,
          g: 0,
          h:
            result.algorithm === 'astar'
              ? heuristicParts(result.start, result.goal).h
              : 0,
        },
      ];
  const selected = before.find((n) => n.id === step.current);
  const h = selected.h,
    f = selected.g + h;
  const tied = before.filter((n) => n.g + n.h === f).length > 1;
  const text = step.done
    ? `${city(step.current)} is selected from the frontier. The optimal route is complete at ${step.cost} km. Discovering a goal as a neighbour would not be enough to stop.`
    : `${city(step.current)} has the lowest ${result.algorithm === 'astar' ? 'g + h' : 'cost so far, g'} in the frontier (${f} km). ${tied ? 'Equal priorities are resolved alphabetically. ' : ''}Its outgoing roads are now examined; cheaper routes update the frontier.`;
  return {
    title: step.done ? 'Goal reached' : `Why ${city(step.current)}?`,
    text,
    node: step.current,
    g: selected.g,
    h,
  };
}

export function compareExample(example) {
  const [start, goal] = exampleIds(example);
  return {
    ...example,
    startId: start,
    goalId: goal,
    ucs: search(start, goal, 'ucs', { trace: false }),
    astar: search(start, goal, 'astar', { trace: false }),
  };
}

export function allPairsEvidence() {
  let agree = 0,
    fewer = 0,
    equal = 0,
    more = 0,
    hopStronger = 0;
  for (const start of cities) {
    for (const goal of cities) {
      const u = search(start.id, goal.id, 'ucs', { trace: false });
      const a = search(start.id, goal.id, 'astar', { trace: false });
      if (u.cost === a.cost) {
        agree++;
      }
      if (a.expanded < u.expanded) {
        fewer++;
      } else if (a.expanded === u.expanded) {
        equal++;
      } else {
        more++;
      }
      const parts = heuristicParts(start.id, goal.id);
      if (parts.hopBound > Math.max(...parts.landmarks.map((p) => p.bound))) {
        hopStronger++;
      }
    }
  }
  return { pairs: cities.length ** 2, agree, fewer, equal, more, hopStronger };
}

export function comparisonAt(result, tick) {
  const index = Math.min(Math.max(0, tick), result.steps.length) - 1;
  const step = index >= 0 ? result.steps[index] : null;
  const decision = decisionAt(result, index);
  return {
    index,
    step,
    decision,
    done: !!step?.done,
    expanded: step ? step.explored.length - (step.done ? 1 : 0) : 0,
    frontier: step?.frontier || [
      { id: result.start, g: 0, h: decision.h, f: decision.h },
    ],
  };
}
