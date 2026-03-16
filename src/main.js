const avg = a => a.length ? (a.reduce((x,y)=>x+y,0)/a.length) : 0;
const byDate = (a,b)=>new Date(a.date)-new Date(b.date);

async function load(){
  const nutrition = await fetch('../data/nutrition.json').then(r=>r.json());
  renderNutrition(nutrition.entries||[]);
}

function kpi(container, items){
  container.innerHTML = items.map(i=>`<div class='card'><div class='k'>${i.k}</div><div class='v'>${i.v}</div></div>`).join('');
}

function fmtDate(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US',{month:'short', day:'numeric'});
}

function renderNutrition(entries){
  entries.sort(byDate);
  const latest = [...entries].reverse().find(e=>e.weight || e.muscle || e.fat) || {};
  const cals = entries.map(e=>e.calories).filter(Boolean);
  const prot = entries.map(e=>e.protein).filter(Boolean);
  const mus = entries.map(e=>e.muscle).filter(Boolean);

  kpi(document.getElementById('nutrition-kpis'), [
    {k:'Total days logged', v: entries.length},
    {k:'Avg calories', v: Math.round(avg(cals))},
    {k:'Avg protein (g)', v: Math.round(avg(prot))},
    {k:'Latest % muscle', v: latest.muscle ?? '-'}
  ]);

  document.getElementById('latestMetrics').innerHTML = `
    <p>Weight: <b>${latest.weight ?? '-'}</b></p>
    <p>Muscle %: <b>${latest.muscle ?? '-'}</b></p>
    <p>Fat %: <b>${latest.fat ?? '-'}</b></p>
    <p>Date: <b>${latest.date ? fmtDate(latest.date) : '-'}</b></p>`;

  const newestFirst = [...entries].sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('nutritionTable').innerHTML = `
    <thead><tr><th>Date</th><th>Calories</th><th>Protein</th><th>Weight</th><th>%Muscle</th><th>%Fat</th><th>Exercise</th></tr></thead>
    <tbody>${newestFirst.map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${e.calories??''}</td><td>${e.protein??''}</td><td>${e.weight??''}</td><td>${e.muscle??''}</td><td>${e.fat??''}</td><td>${e.exercise??''}</td></tr>`).join('')}</tbody>`;

  drawMuscle(entries.filter(e=>e.muscle));
}

function drawMuscle(entries){
  const c = document.getElementById('muscleChart');
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle='#9fb0d6'; ctx.font='14px sans-serif'; ctx.fillText('% Muscle Trend',12,20);
  if(entries.length<2){ctx.fillText('Not enough muscle % data yet',12,44);return;}
  const vals = entries.map(e=>e.muscle); const min=Math.min(...vals)-1, max=Math.max(...vals)+1;
  const x0=40,y0=210,w=740,h=160;
  ctx.strokeStyle='#2b3c6f'; ctx.strokeRect(x0,y0-h,w,h);
  ctx.strokeStyle='#7cb4ff'; ctx.lineWidth=2; ctx.beginPath();
  entries.forEach((e,i)=>{const x=x0+(i*(w/(entries.length-1))); const y=y0-((e.muscle-min)/(max-min))*h; i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.stroke();
}

load();
