const byId = id => document.getElementById(id);
const fmtDate = value => value ? new Date(value).toLocaleString() : 'Unavailable';
const fmtRate = value => '₹' + Number(value).toFixed(4);
const ns = 'http://www.w3.org/2000/svg';
function drawChart(rows) {
  const svg = byId('chart');
  svg.replaceChildren();
  if (!rows.length) return;
  const rates = rows.map(x => x.rate);
  const min = Math.min(...rates), max = Math.max(...rates);
  const span = Math.max(max - min, 0.01);
  const coords = rows.map((r, i) => [
    30 + (rows.length === 1 ? 370 : i * 740 / (rows.length - 1)),
    200 - ((r.rate - min) / span) * 165
  ]);
  for (let i = 0; i < 4; i++) {
    const y = 35 + i * 55;
    const line = document.createElementNS(ns, 'line');
    for (const [key,val] of Object.entries({x1:30,y1:y,x2:770,y2:y,stroke:'#2d3c55'})) line.setAttribute(key,val);
    svg.append(line);
  }
  const path = document.createElementNS(ns, 'polyline');
  path.setAttribute('points', coords.map(p=>p.join(',')).join(' '));
  path.setAttribute('fill','none'); path.setAttribute('stroke','#65a7ff'); path.setAttribute('stroke-width','3');
  path.setAttribute('stroke-linejoin','round'); svg.append(path);
  const text = document.createElementNS(ns,'text');
  text.setAttribute('x','30');text.setAttribute('y','20');text.setAttribute('fill','#9ba9c1');
  text.textContent = `Min ${fmtRate(min)} · Max ${fmtRate(max)}`;svg.append(text);
}
async function load() {
  try {
    const response = await fetch('/history.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Could not fetch history');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Invalid history format');
    const valid = rows.filter(x=>Number.isFinite(x.rate)&&x.checkedAt);
    if (!valid.length) {byId('status').textContent='Awaiting first check';return;}
    const latest = valid.at(-1), previous = valid.at(-2);
    byId('rate').textContent = fmtRate(latest.rate);
    byId('checked').textContent = fmtDate(latest.checkedAt);
    byId('source').textContent = fmtDate(latest.sourceUpdatedAt);
    byId('provider').textContent = latest.provider || 'ExchangeRate-API (legacy observation)';
    byId('status').textContent = Date.now()-new Date(latest.checkedAt).getTime()>4*3600000?'Delayed':'Updated';
    byId('change').textContent = previous ? `Change since previous check: ${(latest.rate-previous.rate).toFixed(4)} INR`:'First observation';
    byId('count').textContent = valid.length+' observations';
    drawChart(valid.slice(-60));
    const tbody = byId('history');tbody.replaceChildren();
    valid.slice(-12).reverse().forEach((row,i)=>{
      const tr=document.createElement('tr');
      const prev=valid[valid.length-2-i];
      [fmtDate(row.checkedAt),fmtRate(row.rate),prev?(row.rate-prev.rate).toFixed(4):'—'].forEach(value=>{
        const td=document.createElement('td');td.textContent=value;tr.append(td);
      });tbody.append(tr);
    });
  } catch(error) {byId('status').textContent='Data unavailable';console.error(error);}
}
load();
