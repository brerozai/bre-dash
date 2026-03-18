const avg = a => a.length ? (a.reduce((x,y)=>x+y,0)/a.length) : 0;

function kpi(container, items){
  container.innerHTML = items.map(i=>`<div class='card'><div class='k'>${i.k}</div><div class='v'>${i.v}</div></div>`).join('');
}

function norm(s=''){ return String(s).toLowerCase().trim(); }

function renderJobs(entries){
  const inProgress = entries.filter(e=> norm(e.status)==='applied');
  const rejected = entries.filter(e=> norm(e.status)==='rejected');
  const accepted = entries.filter(e=> norm(e.status)==='accepted');
  const interviews = entries.filter(e=>{
    const m=norm(e.madeItTo||'');
    return m.includes('screen') || m.includes('manager') || m.includes('interview') || m.includes('recruiter');
  });

  const payMid = entries.map(e=>e.payMid).filter(Number.isFinite);

  kpi(document.getElementById('job-kpis'), [
    {k:'Total roles applied', v: entries.length},
    {k:'Accepted', v: accepted.length},
    {k:'Rejected', v: rejected.length},
    {k:'In progress (Applied)', v: inProgress.length},
    {k:'Interview processes', v: interviews.length},
    {k:'Avg pay midpoint', v: payMid.length ? `$${Math.round(avg(payMid)).toLocaleString()}` : '-'}
  ]);

  const tbl = (id,title,rows)=> document.getElementById(id).innerHTML = `
    <thead><tr><th colspan='6'>${title}</th></tr>
    <tr><th>Company</th><th>Role</th><th>Status</th><th>Location</th><th>Source</th><th>Link</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td>${r.company||''}</td>
      <td>${r.role||''}</td>
      <td>${r.stage||r.status||''}</td>
      <td>${r.location||''}</td>
      <td>${r.sheet||''}</td>
      <td>${r.url?`<a href='${r.url}' target='_blank'>Open</a>`:''}</td>
    </tr>`).join('')}</tbody>`;

  tbl('inProgressTable','In-progress roles (Applied)',inProgress);
  tbl('allRolesTable','All imported roles',entries);
}

fetch('./data/jobs.json').then(r=>r.json()).then(d=>renderJobs(d.entries||[]));
