import {cities,roads,search,benchmark,heuristicParts,validateCity} from './search.js';
import {repositoryUrl} from './config.js';
const $=id=>document.getElementById(id);
let start=0,goal=12,algorithm='astar',results={},timings=null,index=-1,timer=null;
const name=id=>cities[id].name;
const pathText=path=>path.map(name).join(' → ');
const svgNS='http://www.w3.org/2000/svg';
function svg(tag,attrs,text){const el=document.createElementNS(svgNS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
for(const id of ['start','goal'])for(const c of [...cities].sort((a,b)=>a.name.localeCompare(b.name))){const option=document.createElement('option');option.value=c.id;option.textContent=c.name;$(id).append(option);}
$('start').value=start;$('goal').value=goal;
function stop(){clearInterval(timer);timer=null;$('play').textContent='Play search';}
function compare(){stop();start=Number($('start').value);goal=Number($('goal').value);timings=null;results={ucs:search(start,goal,'ucs'),astar:search(start,goal,'astar')};index=-1;render();$('announcement').textContent=`Compared ${name(start)} to ${name(goal)}. Both routes cost ${results.ucs.cost} kilometres.`;}
function renderMap(step){
 const map=$('map');map.querySelectorAll('g').forEach(g=>g.remove());
 const group=svg('g',{}),path=step?.path||results[algorithm].path;
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
 $('results').innerHTML=['ucs','astar'].map(a=>{const r=results[a];return `<article class="result-card ${a===algorithm?'active':''}"><div class="result-header"><h3>${a==='ucs'?'Uniform-Cost Search':'A* Search'}</h3><span>${a==='ucs'?'BLIND SEARCH':'TRI-ANCHOR + HOP'}</span></div><div class="metrics"><div class="metric"><label>Path cost</label><strong>${r.cost} <small>km</small></strong></div><div class="metric"><label>Expanded cities</label><strong>${r.expanded}<small> / 20</small></strong></div><div class="metric"><label>Median runtime</label><strong>${timings?(timings[a]*1000).toFixed(1):'—'} <small>${timings?'µs':'unmeasured'}</small></strong></div></div><div class="result-details"><span>Peak frontier: ${r.peakFrontier}</span><span>Peak stored cities: ${r.peakStored}</span><span>Storage model: ${r.searchBytes+r.heuristicBytes} B</span></div><p class="result-path">${pathText(r.path)}</p></article>`;}).join('');
 const saved=results.ucs.expanded-results.astar.expanded;
 $('insight').textContent=`Both searches find a ${results.ucs.cost} km optimal route. ${saved>0?`A* examines ${saved} fewer ${saved===1?'city':'cities'} before reaching the goal.`:saved===0?'Both examine the same number of cities for this pair.':`A* examines ${-saved} more cities for this pair under alphabetical tie-breaking.`} ${start===goal?'You are already at the destination: no road travel is needed.':'A* trades extra heuristic preparation and storage for guidance toward the goal.'}`;
 $('timing-note').textContent=timings?`Median of ${timings.batches} batches × ${timings.runs} searches, after warm-up. A* goal preparation: ${(timings.goalSetupMs*1000).toFixed(1)} µs; one-time landmark preparation: ${(timings.landmarkSetupMs*1000).toFixed(1)} µs. Preparation is excluded from search timing. Storage is a logical payload estimate, not browser heap usage.`:'Runtime is measured separately from animation. Memory figures model stored search data; they are not browser heap measurements.';
}
function render(){
 const r=results[algorithm],step=index>=0?r.steps[index]:null;
 $('map-algorithm').textContent=algorithm==='astar'?'A* SEARCH':'UNIFORM-COST';
 $('route-cost').textContent=`${r.cost} km`;$('route-description').textContent=`${r.path.length-1} roads · ${name(start)} to ${name(goal)}`;
 $('timeline').max=r.steps.length;$('timeline').value=index+1;
 $('step-label').textContent=index<0?'Route overview':`${index+1} / ${r.steps.length}`;
 $('current-node').textContent=step?`${step.done?'GOAL':'CURRENT'} · ${name(step.current)}`:'ROUTE OVERVIEW';
 const initial=[{id:start,g:0,h:algorithm==='astar'?heuristicParts(start,goal).h:0}];initial[0].f=initial[0].h;
 const frontier=step?.frontier||initial;
 $('frontier').innerHTML=frontier.length?frontier.map(n=>`<tr><td>${name(n.id)}</td><td>${n.g}</td><td>${n.h}</td><td>${n.f}</td></tr>`).join(''):'<tr><td colspan="4">No cities waiting.</td></tr>';
 $('current-path').textContent=step?`${pathText(step.path)} · ${step.cost} km`:'Press Play search or Step to inspect each decision.';
 $('explored').innerHTML=step?.explored.map(id=>`<span>${name(id)}</span>`).join('')||'<span>Search has not started</span>';
 const parts=heuristicParts(step?.current??start,goal);
 $('heuristic-example').innerHTML=`<div class="example">At ${name(step?.current??start)}, heading to ${name(goal)}:<br>landmark bounds ${parts.landmarks.map(p=>p.bound).join(', ')} km · hop bound ${parts.hopBound} km<br><strong>h(n) = ${parts.h} km</strong></div>`;
 renderMap(step);renderResults();
}
$('run').addEventListener('click',compare);
for(const id of ['start','goal'])$(id).addEventListener('change',compare);
$('swap').addEventListener('click',()=>{const s=$('start').value;$('start').value=$('goal').value;$('goal').value=s;compare();});
for(const input of document.querySelectorAll('input[name=algorithm]'))input.addEventListener('change',()=>{stop();algorithm=input.value;index=-1;render();});
function advance(){if(index>=results[algorithm].steps.length-1){stop();return;}index++;render();if(index===results[algorithm].steps.length-1)stop();}
$('step').addEventListener('click',()=>{stop();advance();});
function play(){if(timer){stop();return;}if(index>=results[algorithm].steps.length-1)index=-1;advance();if(index<results[algorithm].steps.length-1){$('play').textContent='Pause';timer=setInterval(advance,Number($('speed').value));}}
$('play').addEventListener('click',play);$('speed').addEventListener('change',()=>{if(timer){stop();play();}});
$('timeline').addEventListener('input',()=>{stop();index=Number($('timeline').value)-1;render();});
$('benchmark').addEventListener('click',async()=>{stop();const button=$('benchmark');button.disabled=true;button.textContent='Measuring…';await new Promise(resolve=>setTimeout(resolve,40));try{timings=benchmark(start,goal);renderResults();}finally{button.disabled=false;button.textContent='Measure runtime';}});
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
