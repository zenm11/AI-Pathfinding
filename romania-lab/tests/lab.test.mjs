import test from 'node:test';
import assert from 'node:assert/strict';
import {cities, search, heuristicParts} from '../dist/search.js';
import {examples, compareExample, decisionAt, storageBreakdown, allPairsEvidence} from '../dist/lab.js';

test('decision explanations use the pre-selection frontier, including ties and goal selection', () => {
  let sawTie=false;
  for (const start of cities) for (const goal of cities) for (const algorithm of ['ucs','astar']) {
    const result=search(start.id,goal.id,algorithm);
    const ready=decisionAt(result,-1);
    assert.equal(ready.g,0);assert.equal(ready.node,start.id);
    for (let i=0;i<result.steps.length;i++) {
      const step=result.steps[i],decision=decisionAt(result,i);
      assert.equal(decision.node,step.current);assert.equal(decision.g,step.cost);
      assert.equal(decision.h,algorithm==='astar'?heuristicParts(step.current,goal.id).h:0);
      if (i) {
        const before=result.steps[i-1].frontier;
        assert.equal(decision.g+decision.h,Math.min(...before.map(n=>n.f)));
        if (!step.done && before.filter(n=>n.f===decision.g+decision.h).length>1) {
          assert.match(decision.text,/alphabetically/);sawTie=true;
        }
      }
      if(step.done)assert.equal(decision.title,'Goal reached');
    }
  }
  assert(sawTie);
});

test('storage breakdown adds to the reported estimate for every route and algorithm',()=>{
  for(const start of cities)for(const goal of cities)for(const algorithm of ['ucs','astar']){
    const r=search(start.id,goal.id,algorithm,{trace:false});
    assert.equal(Object.values(storageBreakdown(r)).reduce((a,b)=>a+b,0),r.searchBytes+r.heuristicBytes);
  }
});

test('study includes distinct endpoints, hop-dominant and zero-distance cases',()=>{
  const rows=examples.map(compareExample);assert.equal(rows.length,5);
  for(const row of rows){assert.equal(row.ucs.cost,row.astar.cost);assert(Number.isFinite(row.ucs.cost));}
  const hop=rows[2],parts=heuristicParts(hop.startId,hop.goalId);
  assert(parts.hopBound>Math.max(...parts.landmarks.map(p=>p.bound)));
  assert.equal(rows.at(-1).ucs.cost,0);assert.equal(rows.at(-1).astar.expanded,0);
});

test('all-pairs evidence covers the graph and accounts for every comparison',()=>{
  const e=allPairsEvidence();assert.equal(e.pairs,400);assert.equal(e.agree,e.pairs);
  assert.equal(e.fewer+e.equal+e.more,e.pairs);assert(e.hopStronger>0);assert(e.equal>=20);
});
