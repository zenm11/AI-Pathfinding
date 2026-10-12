import {cities,roads,search,benchmark,heuristicParts,validateCity} from './search.js';
import {examples, exampleIds, compareExample, allPairsEvidence, decisionAt, storageBreakdown, comparisonAt} from './lab.js?v=20261012-compare';
import {repositoryUrl} from './config.js';
const $=id=>document.getElementById(id);
let start=0,goal=12,algorithm='astar',results={},timings=null,index=-1,timer=null,preview=false;
let study=examples.map(compareExample),studyBusy=false;
let compareTick=0,compareTimer=null,explainPage=0;
const name=id=>cities[id].name;
const pathText=path=>path.map(name).join(' → ');
const svgNS='http://www.w3.org/2000/svg';
function svg(tag,attrs,text){const el=document.createElementNS(svgNS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
for(const id of ['start','goal'])for(const c of [...cities].sort((a,b)=>a.name.localeCompare(b.name))){const option=document.createElement('option');option.value=c.id;option.textContent=c.name;$(id).append(option);}
$('start').value=start;$('goal').value=goal;
function stop(){clearInterval(timer);timer=null;$('play').textContent='Play search';}
function compare(){stopBoth();compareTick=0;stop();start=Number($('start').value);goal=Number($('goal').value);timings=null;results={ucs:search(start,goal,'ucs'),astar:search(start,goal,'astar')};index=-1;preview=false;render();renderComparison();$('announcement').textContent=`Compared ${name(start)} to ${name(goal)}. Both routes cost ${results.ucs.cost} kilometres.`;}
function renderMap(step,map=$('map'),path=preview?results[algorithm].path:(step?.path||[])){
 map.querySelectorAll('g').forEach(g=>g.remove());
 const group=svg('g',{});
 const highlighted=new Set(path.slice(1).map((id,i)=>[path[i],id].sort((a,b)=>a-b).join('-')));
 for(const e of roads){const a=cities[e.a],b=cities[e.b],on=highlighted.has([e.a,e.b].sort((a,b)=>a-b).join('-'));group.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'road'+(on?' path':'')}));}
 for(const e of roads){const a=cities[e.a],b=cities[e.b];group.append(svg('text',{x:(a.x+b.x)/2+7,y:(a.y+b.y)/2-6,class:'road-label','text-anchor':'middle'},e.cost));}
 for(const c of cities){let state=step?.explored.includes(c.id)?' explored':'';if(step?.frontier.some(f=>f.id===c.id))state=' frontier';if(c.id===start)state=' start';if(c.id===goal)state=' goal';
  if(c.id===step?.current)group.append(svg('circle',{cx:c.x,cy:c.y,r:17,class:'city-current'}));
  group.append(svg('circle',{cx:c.x,cy:c.y,r:c.id===start||c.id===goal?8:6,class:'city-dot'+state}));
  const left=['Arad','Drobeta','Giurgiu'].includes(c.name),above=['Timisoara','Neamt','Oradea','Fagaras','Craiova','Rimnicu Vilcea'].includes(c.name);
  group.append(svg('text',{x:c.x+(above?0:left?-13:13),y:c.y+(above?-17:5),'text-anchor':above?'middle':left?'end':'start',class:'city-label'},c.name));
 }
 map.append(group);
}
function renderResults(){
 $('results').innerHTML=['ucs','astar'].map(a=>{const r=results[a];return `<article class="result-card ${a===algorithm?'active':''}"><div class="result-header"><h3>${a==='ucs'?'Uniform-Cost Search':'A* Search'}</h3><span>${a==='ucs'?'BLIND SEARCH':'TRI-ANCHOR + HOP'}</span></div><div class="metrics"><div class="metric"><label>Path cost</label><strong>${r.cost} <small>km</small></strong></div><div class="metric"><label>Expanded cities</label><strong>${r.expanded}<small> / 20</small></strong></div><div class="metric"><label>Median runtime</label><strong>${timings?(timings[a]*1000).toFixed(1):'—'} <small>${timings?'µs':'unmeasured'}</small></strong></div></div><div class="result-details"><span>Peak frontier: ${r.peakFrontier}</span><span>Peak stored cities: ${r.peakStored}</span><span>Estimated storage: ${r.searchBytes+r.heuristicBytes} B</span></div><p class="result-path">${pathText(r.path)}</p></article>`;}).join('');
 const saved=results.ucs.expanded-results.astar.expanded;
 $('insight').textContent=`Both searches find a ${results.ucs.cost} km optimal route. ${saved>0?`A* examines ${saved} fewer ${saved===1?'city':'cities'} before reaching the goal.`:saved===0?'Both examine the same number of cities for this pair.':`A* examines ${-saved} more cities for this pair under alphabetical tie-breaking.`} ${start===goal?'You are already at the destination: no road travel is needed.':'A* trades extra heuristic preparation and storage for guidance toward the goal.'}`;
 $('timing-note').textContent=timings?`Median of ${timings.batches} batches × ${timings.runs} searches, after warm-up. A* goal preparation: ${(timings.goalSetupMs*1000).toFixed(1)} µs; one-time landmark preparation: ${(timings.landmarkSetupMs*1000).toFixed(1)} µs. Preparation is excluded from search timing. Storage is a logical payload estimate, not browser heap usage.`:'Runtime is measured separately from animation. Memory figures model stored search data; they are not browser heap measurements.';
}
function render(){
 const r=results[algorithm],step=index>=0?r.steps[index]:null;
 $('map-algorithm').textContent=algorithm==='astar'?'A* SEARCH':'UNIFORM-COST';
 $('route-cost').textContent=`${r.cost} km`;$('route-description').textContent=`${r.path.length-1} roads · ${name(start)} to ${name(goal)}`;
 $('timeline').max=r.steps.length;$('timeline').value=index+1;
 $('step-label').textContent=index<0?'Ready':`${index+1} / ${r.steps.length}`;
 $('current-node').textContent=step?`${step.done?'GOAL':'CURRENT'} · ${name(step.current)}`:'SEARCH READY';
 const initial=[{id:start,g:0,h:algorithm==='astar'?heuristicParts(start,goal).h:0}];initial[0].f=initial[0].h;
 const frontier=step?.frontier||initial;
 $('frontier').innerHTML=frontier.length?frontier.map(n=>`<tr><td>${name(n.id)}</td><td>${n.g}</td><td>${n.h}</td><td>${n.f}</td></tr>`).join(''):'<tr><td colspan="4">No cities waiting.</td></tr>';
 $('current-path').textContent=step?`${pathText(step.path)} · ${step.cost} km`:'Press Play search or Step to inspect each decision.';
 $('explored').innerHTML=step?.explored.map(id=>`<span>${name(id)}</span>`).join('')||'<span>Search has not started</span>';
 const parts=heuristicParts(step?.current??start,goal);
 $('heuristic-example').innerHTML=`<div class="example">At ${name(step?.current??start)}, heading to ${name(goal)}:<br>landmark bounds ${parts.landmarks.map(p=>p.bound).join(', ')} km · hop bound ${parts.hopBound} km<br><strong>h(n) = ${parts.h} km</strong></div>`;
 renderMap(step);renderResults();renderDecision(step);renderStorage();
}
function renderDecision(step) {
 const r=results[algorithm],d=decisionAt(r,index),parts=heuristicParts(d.node,goal);
 $('view-state').textContent=preview?'FINAL ROUTE PREVIEW':step?(step.done?'SEARCH COMPLETE':'SEARCH PLAYBACK'):'SEARCH READY';
 $('preview').textContent=preview?'Return to search':'Preview final route';
 $('preview').setAttribute('aria-pressed',String(preview));
 $('path-legend').textContent=preview||step?.done?'Final route':'Current path';
 $('step').disabled=index===r.steps.length-1&&!preview;
 $('reset').disabled=index<0&&!preview;
 $('decision-count').textContent=preview?'Result':step?`${index+1} / ${r.steps.length}`:'Ready';
 $('decision-title').textContent=preview?'The optimal route':d.title;
 $('decision-text').textContent=preview?`${pathText(r.path)}. Total: ${r.cost} km across ${r.path.length-1} roads. Return to search or press Play to follow how it was found.`:d.text;
 $('decision-math').innerHTML=preview?`<strong>${r.cost} km</strong><span>Final path cost</span>`:`<span>g <strong>${d.g}</strong></span><span>${algorithm==='astar'?'+ h':'h (unused)'} <strong>${d.h}</strong></span><span>= priority <strong>${d.g+d.h}</strong></span>`;
 const bounds=[...parts.landmarks.map(p=>({label:p.name,calculation:`|${p.toNode} − ${p.toGoal}|`,value:p.bound})),{label:'Fewest roads',calculation:`${parts.hopBound/70} × 70`,value:parts.hopBound}];
 $('bound-breakdown').innerHTML=preview?'<p class="small-note">Return to search to inspect the estimate for each selected city.</p>':algorithm==='ucs'?'<p class="small-note">UCS does not use an estimate. Its priority is only g(n), the cost so far.</p>':`<p class="small-note">${name(d.node)} → ${name(goal)}<br>Each landmark expression is |distance to city − distance to goal|.</p><ul class="bound-list">${bounds.map(b=>`<li class="${b.value===parts.h?'winning-bound':''}"><span>${b.label}<small>${b.calculation}</small></span><strong>${b.value}${b.value===parts.h?'<small>MAX</small>':''}</strong></li>`).join('')}</ul><p class="bound-answer">Take the largest lower bound: <strong>h = ${parts.h} km</strong></p>`;
 const frontier=step?.frontier||[{id:start,g:0,h:algorithm==='astar'?parts.h:0}];
 $('frontier-caption').textContent=preview?'Playback is paused':step?.done?'Goal selected':step?'After this step · lowest priority first':'Before the first step · lowest priority first';
 $('next-frontier').innerHTML=preview?'<li class="small-note">Return to search to continue exploring.</li>':step?.done?'<li class="small-note">Search complete. No further selection is needed.</li>':frontier.slice(0,3).map(n=>`<li><span>${name(n.id)}</span><strong>${n.g+n.h}</strong></li>`).join('')||'<li>Frontier empty</li>';
}
function renderStorage() {
 const u=storageBreakdown(results.ucs),a=storageBreakdown(results.astar);
 const rows=[['Costs (typed array)','costs'],['Parents (typed array)','parents'],['Explored flags (typed array)','flags'],['Peak frontier (8 B per entry assumed)','frontier'],['Goal heuristic (typed array)','heuristic'],['Shared landmark tables (typed arrays)','landmarks']];
 $('storage-breakdown').innerHTML=rows.map(([label,key])=>`<tr><td>${label}</td><td>${u[key]}</td><td>${a[key]}</td></tr>`).join('')+`<tr class="total-row"><td>Total estimated retained storage</td><td>${results.ucs.searchBytes}</td><td>${results.astar.searchBytes+results.astar.heuristicBytes}</td></tr>`;
}
const micros=value=>(value*1000).toFixed(1);
function renderStudy() {
 $('study-results').innerHTML=study.map((row,i)=>['ucs','astar'].map((a,j)=>`<tr>${j===0?`<th scope="rowgroup" rowspan="2"><button class="route-link" data-example="${i}">${row.start} → ${row.goal}</button><small>${row.reason}</small></th>`:''}<td>${a==='ucs'?'UCS':'A*'}</td><td>${row[a].cost}</td><td>${row[a].expanded}</td><td>${row.timing?micros(row.timing[a]):'—'}</td><td>${a==='ucs'?'n/a':row.timing?micros(row.timing.goalSetupMs):'—'}</td><td>${row[a].searchBytes+row[a].heuristicBytes}</td></tr>`).join('')).join('');
}
$('reset').addEventListener('click',()=>{stop();index=-1;preview=false;render();});
$('preview').addEventListener('click',()=>{stop();preview=!preview;render();});
$('study-results').addEventListener('click',event=>{
 const button=event.target.closest('[data-example]');if(!button)return;
 const [s,g]=exampleIds(examples[Number(button.dataset.example)]);
 $('start').value=s;$('goal').value=g;compare();document.querySelector('.workspace').scrollIntoView({behavior:'smooth',block:'start'});
});
$('run-study').addEventListener('click',async()=>{
 if(studyBusy)return;studyBusy=true;stopBoth();stop();$('run-study').disabled=true;$('export-study').disabled=true;
 try {
  for(let i=0;i<study.length;i++) {
   $('study-status').textContent=`Measuring route ${i+1} of ${study.length}…`;
   await new Promise(resolve=>setTimeout(resolve,40));
   study[i].timing=benchmark(study[i].startId,study[i].goalId);study[i].measuredAt=new Date().toISOString();renderStudy();
  }
  $('study-status').textContent=`Measured on this device at ${new Date().toLocaleTimeString()}. Search: median of 15 batches × 100 runs after warm-up, with no animation. Goal preparation: one timed sample per route, excluded from search. One-time landmark preparation: ${micros(study[0].timing.landmarkSetupMs)} µs, shared across routes. Small times are noisy; 0.0 means below displayed precision. Storage is estimated, not browser RAM.`;
  $('export-study').disabled=false;
 } catch { $('study-status').textContent='Measurement could not finish. Please try again.'; }
 finally {studyBusy=false;$('run-study').disabled=false;}
});
$('export-study').addEventListener('click',()=>{
 if(studyBusy||study.some(r=>!r.timing))return;
 const rows=[['start','goal','algorithm','cost_km','expanded_cities','median_search_us','goal_preparation_us_single_sample','one_time_landmark_preparation_us','estimated_retained_storage_bytes','storage_note','measured_at']];
 for(const row of study)for(const a of ['ucs','astar'])rows.push([row.start,row.goal,a,row[a].cost,row[a].expanded,micros(row.timing[a]),a==='astar'?micros(row.timing.goalSetupMs):'',a==='astar'?micros(row.timing.landmarkSetupMs):'',row[a].searchBytes+row[a].heuristicBytes,'Payload model; excludes object overhead, temporary preparation and visualization',row.measuredAt||'']);
 const csv=rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='romania-search-comparison.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('check-pairs').addEventListener('click',async()=>{
 const button=$('check-pairs');button.disabled=true;$('pair-evidence').textContent='Comparing all city pairs…';
 await new Promise(resolve=>setTimeout(resolve,40));
 try {const e=allPairsEvidence();$('pair-evidence').innerHTML=`<div class="evidence-grid"><div><strong>${e.agree} / ${e.pairs}</strong><span>matching path costs</span></div><div><strong>${e.fewer}</strong><span>pairs with fewer A* expansions</span></div><div><strong>${e.equal}</strong><span>pairs with equal expansions</span></div><div><strong>${e.hopStronger}</strong><span>pairs with a stronger hop bound</span></div></div><p class="small-note">A* expands more cities in ${e.more} pairs. These results describe this map and the current alphabetical tie-breaking, not a guarantee of faster runtime. Landmark preprocessing can give exact bounds on some routes, including those to or from a landmark.</p>`;}
 catch {$('pair-evidence').textContent='Comparison could not finish. Please try again.';}
 finally {button.disabled=false;}
});
function stopBoth(){clearInterval(compareTimer);compareTimer=null;$('compare-play').textContent='Play both';}
function openComparison(){stop();$('comparison-title').focus({preventScroll:true});$('comparison').scrollIntoView({behavior:'smooth',block:'start'});}
function comparisonLength(){return Math.max(results.ucs.steps.length,results.astar.steps.length);}
function renderComparison(){
 $('comparison-route').textContent=`${name(start)} → ${name(goal)}`;
 const max=comparisonLength();
 $('compare-timeline').max=max;$('compare-timeline').value=compareTick;
 $('compare-tick').textContent=compareTick?`${compareTick} / ${max}`:'Ready';
 $('compare-step').disabled=compareTick>=max;$('compare-reset').disabled=compareTick===0;
 for(const a of ['ucs','astar']){
  const r=results[a],state=comparisonAt(r,compareTick),{step,decision:d}=state;
  renderMap(step,$(`${a}-compare-map`),step?.path||[]);
  $(`${a}-compare-status`).textContent=state.done?'GOAL REACHED':step?`SELECTION ${state.index+1}`:'READY';
  $(`${a}-compare-current`).textContent=step?(state.done?`Goal reached · ${name(d.node)}`:d.title):`Start at ${name(start)}`;
  $(`${a}-compare-math`).textContent=a==='ucs'?`Priority = g = ${d.g} km`:`Priority = g + h = ${d.g} + ${d.h} = ${d.g+d.h} km`;
  $(`${a}-compare-why`).textContent=compareTick?d.text:'Both searches start with only the starting city in the frontier. Press Step both to begin.';
  $(`${a}-compare-counts`).innerHTML=`<span><strong>${state.expanded}</strong> expanded so far</span><span><strong>${state.frontier.length}</strong> waiting${state.done?' (unused)':''}</span>`;
  $(`${a}-compare-frontier`).innerHTML=state.frontier.map(n=>`<li>${name(n.id)} <span>${a==='ucs'?`g = ${n.g}`:`${n.g} + ${n.h} = ${n.f}`}</span></li>`).join('')||'<li>No cities waiting.</li>';
 }
}
function advanceBoth(){if(compareTick>=comparisonLength()){stopBoth();return;}compareTick++;renderComparison();if(compareTick>=comparisonLength())stopBoth();}
$('compare-play').addEventListener('click',()=>{stop();if(compareTimer){stopBoth();return;}if(compareTick>=comparisonLength())compareTick=0;advanceBoth();if(compareTick<comparisonLength()){$('compare-play').textContent='Pause both';compareTimer=setInterval(advanceBoth,Number($('compare-speed').value));}});
$('compare-step').addEventListener('click',()=>{stop();stopBoth();advanceBoth();});
$('compare-reset').addEventListener('click',()=>{stopBoth();compareTick=0;renderComparison();});
$('compare-timeline').addEventListener('input',()=>{stop();stopBoth();compareTick=Number($('compare-timeline').value);renderComparison();});
$('compare-speed').addEventListener('change',()=>{if(compareTimer){clearInterval(compareTimer);compareTimer=setInterval(advanceBoth,Number($('compare-speed').value));}});
const explainPages=[
 ['What is the search trying to do?',()=>`<p>Find a route from <strong>${name(start)}</strong> to <strong>${name(goal)}</strong> with the lowest total road distance.</p><p>The map is a graph: cities are nodes, roads are edges, and the number on each road is its cost in kilometres. Both algorithms know those road costs.</p><p>A search explores possible routes in memory. The final route can be different from the order in which cities were explored.</p>`],
 ['What does “priority” mean?',()=>`<p>The <strong>frontier</strong> is the list of discovered cities waiting to be examined. Priority is the number used to choose the next city. <strong>The lowest number goes first.</strong></p><dl><dt>g(n): cost so far</dt><dd>The cost of the best route found from the start to city n.</dd><dt>h(n): remaining estimate</dt><dd>A lower bound on the cost from city n to the selected goal.</dd></dl><p><strong>UCS uses g.</strong> It is unguided, but it is not random.<br><strong>A* uses g + h.</strong> It combines real road costs with guidance toward the goal.</p>`],
 ['Why can they choose different cities?',()=>`<p>For the example <strong>Arad to Bucharest</strong>, after expanding Arad:</p><div class="table-scroll"><table><thead><tr><th>City</th><th>g</th><th>h</th><th>A* priority</th></tr></thead><tbody><tr><td>Zerind</td><td>75</td><td>493</td><td>568</td></tr><tr><td>Timisoara</td><td>118</td><td>536</td><td>654</td></tr><tr><td>Sibiu</td><td>140</td><td>278</td><td>418</td></tr></tbody></table></div><p>All values are kilometres. <strong>UCS chooses Zerind</strong> because 75 is the lowest g. <strong>A* chooses Sibiu</strong> because 418 is the lowest g + h.</p><p>Each search then examines the chosen city's neighbors, updates any cheaper routes, and picks the next lowest priority from the whole frontier. It does not expand all neighbors at once.</p>`],
 ['Where does Tri-Anchor + Hop fit?',()=>`<p>It supplies <strong>h(n)</strong> for A*. It combines four lower bounds on the remaining distance:</p><ul><li>Three anchor bounds from Arad, Neamt, and Eforie: <strong>|distance from anchor to n − distance from anchor to goal|</strong>.</li><li>One hop bound: <strong>fewest roads remaining × 70 km</strong>, because every road costs at least 70 km.</li></ul><p>Take the <strong>maximum</strong> of the four bounds. Adding them could double-count distance. The anchors are reference points, not required stops.</p><p>At Sibiu heading to Bucharest: h = max(278, 278, 278, 140) = <strong>278 km</strong>. If the route from Arad cost 140 km, priority is 140 + 278 = <strong>418 km</strong>.</p><p>The app computes h independently of g. It is not generally an earlier priority minus distance travelled.</p>`],
 ['How to read the comparison',()=>`<p><strong>Step both</strong> selects one city per unfinished search. The ring marks that city. Each panel tells you why it was chosen. A search stops when it selects the goal from its frontier.</p><p>When A* finishes earlier in the playback, its final route stays visible while UCS continues. The animation compares search effort. <strong>It does not measure runtime.</strong></p><p>The final result cards report total path cost, expanded cities, and estimated storage. Use <strong>Measure runtime</strong> for timed results. A* may explore fewer cities while using more storage or preparation time.</p><p>The full explanation under <strong>How it works</strong> includes the formula, code, and why the bounds preserve the optimal path cost.</p>`]
];
function renderExplanation(){const [title,content]=explainPages[explainPage];$('explain-title').textContent=title;$('explain-content').innerHTML=content();$('explain-progress').textContent=`${explainPage+1} of ${explainPages.length}`;$('explain-back').disabled=explainPage===0;$('explain-next').textContent=explainPage===explainPages.length-1?'Try side-by-side comparison':'Next';}
$('explain-search').addEventListener('click',()=>{stop();stopBoth();explainPage=0;renderExplanation();$('explain-dialog').showModal();});
$('explain-close').addEventListener('click',()=>$('explain-dialog').close());
$('explain-back').addEventListener('click',()=>{explainPage--;renderExplanation();});
$('explain-next').addEventListener('click',()=>{if(explainPage===explainPages.length-1){$('explain-dialog').close();openComparison();}else{explainPage++;renderExplanation();}});

renderStudy();
$('run').addEventListener('click',()=>{compare();openComparison();});
for(const id of ['start','goal'])$(id).addEventListener('change',compare);
$('swap').addEventListener('click',()=>{const s=$('start').value;$('start').value=$('goal').value;$('goal').value=s;compare();});
for(const input of document.querySelectorAll('input[name=algorithm]'))input.addEventListener('change',()=>{stop();algorithm=input.value;index=-1;preview=false;render();});
function advance(){if(preview){index=-1;preview=false;}if(index>=results[algorithm].steps.length-1){stop();return;}index++;render();if(index===results[algorithm].steps.length-1)stop();}
$('step').addEventListener('click',()=>{stopBoth();stop();advance();});
function play(){stopBoth();if(timer){stop();return;}if(index>=results[algorithm].steps.length-1)index=-1;advance();if(index<results[algorithm].steps.length-1){$('play').textContent='Pause';timer=setInterval(advance,Number($('speed').value));}}
$('play').addEventListener('click',play);$('speed').addEventListener('change',()=>{if(timer){stop();play();}});
$('timeline').addEventListener('input',()=>{stop();index=Number($('timeline').value)-1;preview=false;render();});
$('benchmark').addEventListener('click',async()=>{stopBoth();stop();const measuredStart=start,measuredGoal=goal;const button=$('benchmark');button.disabled=true;button.textContent='Measuring…';await new Promise(resolve=>setTimeout(resolve,40));try{const measured=benchmark(measuredStart,measuredGoal);if(start===measuredStart&&goal===measuredGoal){timings=measured;renderResults();}}finally{button.disabled=false;button.textContent='Measure runtime';}});
if(repositoryUrl&&/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(repositoryUrl)){const a=document.createElement('a');a.href=repositoryUrl;a.textContent='View source on GitHub';a.target='_blank';a.rel='noopener noreferrer';$('repository').append(a);}else{$('repository').textContent='GitHub repository: connection pending';}
compare();
// Optional browser-agent interface; normal controls work without WebMCP support.
const context=document.modelContext;
if(context?.registerTool){
 const lifecycle=new AbortController();
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 try{Promise.resolve(context.registerTool({
  name:'compare_romania_routes',title:'Compare Romania routes',
  description:'Select start and goal cities, run UCS and A*, and update the visible route comparison. Does not benchmark or publish anything.',
  inputSchema:{type:'object',properties:{start:{type:'string',enum:cities.map(c=>c.name)},goal:{type:'string',enum:cities.map(c=>c.name)}},required:['start','goal'],additionalProperties:false},
  annotations:{readOnlyHint:false,untrustedContentHint:false},
  execute(input){
   if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['start','goal'].includes(k)))throw new Error('Provide only start and goal city names.');
   const s=cities.findIndex(c=>c.name===input.start),g=cities.findIndex(c=>c.name===input.goal);validateCity(s);validateCity(g);
   $('start').value=s;$('goal').value=g;compare();
   return Object.fromEntries(['ucs','astar'].map(a=>[a,{path:results[a].path.map(name),costKm:results[a].cost,expanded:results[a].expanded}]));
  }
 },{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability. */}
}
