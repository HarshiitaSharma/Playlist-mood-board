/* ---------- Vibes: id, name, colors, keyword stems (matched at word start) ---------- */
const VIBES = [
  {id:'night', name:'After midnight', bg:'#23224F', fg:'#E6E4FF',
   k:['night','midnight','moon','dark','shadow','neon','city','drive','sleep','3am','2am','late','star','blinding','light','dream','insomnia','after hours']},
  {id:'heart', name:'Heartache', bg:'#8E1F45', fg:'#FFE3EA',
   k:['love','heart','break','broke','cry','tear','miss','goodbye','lonely','alone','sorry','hurt','without','someone like','rain','lost','gone','ex','pain','sad','blue','fade','leave','left']},
  {id:'dance', name:'Dance floor', bg:'#FF4F9A', fg:'#2A0716',
   k:['dance','party','club','fire','tonight','move','groove','bounce','disco','shake','jump','funk','boogie','levitat','dynamite','body','rhythm','beat','electric','wild','swing','hype']},
  {id:'sun', name:'Golden hour', bg:'#FFC93C', fg:'#3A2A00',
   k:['sun','summer','happy','good','beach','smile','golden','sweet','paradise','island','lemon','bright','joy','sunny','morning','holiday','vacation','sugar','honey','shine','dancing queen','feel']},
  {id:'chill', name:'Slow drift', bg:'#7FD6C2', fg:'#0C3B33',
   k:['chill','easy','slow','calm','soft','gentle','lazy','sunday','coffee','breathe','float','ocean','water','cloud','sky','quiet','tea','lullaby','peace','still','wave','river','mellow','sleepy','garden']},
  {id:'heavy', name:'Full volume', bg:'#C23A1E', fg:'#FFF1EC',
   k:['rage','kill','war','fight','hell','blood','burn','scream','thunder','riot','metal','power','monster','devil','bad','angry','crush','storm','destroy','smash','revolution','run','loud']},
  {id:'rewind', name:'Rewind', bg:'#B9A3F0', fg:'#1E1250',
   k:['yesterday','memor','remember','old','young','childhood','forever','90s','80s','70s','back','again','days','once','years','time','nostalg','home','wonder','vintage','retro','sixteen','teen']},
  {id:'none', name:'Unsorted', bg:'#D5D8E4', fg:'#2A2D45', k:[]}
];
const byId = Object.fromEntries(VIBES.map(v=>[v.id,v]));

/* Swap this function out for an LLM call if you want smarter grouping.
   (Spotify audio-features is no longer available to new apps, so keyword matching stays.) */
function classify(title){
  const words = title.toLowerCase().replace(/[^a-z0-9' ]/g,' ').split(/\s+/).filter(Boolean);
  const text = ' ' + words.join(' ');
  let best = 'none', top = 0;
  for(const v of VIBES){
    let score = 0;
    for(const k of v.k){
      const hit = k.includes(' ') ? text.includes(' '+k) : words.some(w=>w===k || (k.length>3 && w.startsWith(k)));
      if(hit) score++;
    }
    if(score>top){top=score;best=v.id}
  }
  return best;
}

function parse(raw){
  return raw.split(/\r?\n/)
    .map(l=>l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/,'').trim())
    .filter(Boolean)
    .map(t=>({t:t.slice(0,90), v:classify(t.includes(' - ') ? t.split(' - ').slice(1).join(' - ') : t)}));
}

/* ---------- State & rendering ---------- */
let songs = [];
const $ = id => document.getElementById(id);

function render(){
  $('board').hidden = !songs.length;
  const grid = $('grid'); grid.textContent = '';
  for(const v of VIBES){
    const items = songs.map((s,i)=>({s,i})).filter(x=>x.s.v===v.id);
    if(!items.length) continue;
    const tile = document.createElement('div');
    tile.className = 'tile'; tile.style.background = v.bg; tile.style.color = v.fg;
    tile.innerHTML = '<h2></h2><p class="n"></p><ul></ul>';
    tile.querySelector('h2').textContent = v.name;
    tile.querySelector('.n').textContent = items.length + (items.length===1?' song':' songs');
    const ul = tile.querySelector('ul');
    for(const {s,i} of items){
      const li = document.createElement('li');
      const span = document.createElement('span'); span.textContent = s.t;
      const sel = document.createElement('select'); sel.title = 'Move to another vibe'; sel.setAttribute('aria-label','Move "'+s.t+'" to another vibe');
      sel.add(new Option('Move…',''));
      VIBES.filter(o=>o.id!==v.id).forEach(o=>sel.add(new Option(o.name,o.id)));
      sel.onchange = () => { if(sel.value){ songs[i].v = sel.value; render(); } };
      li.append(span, sel); ul.append(li);
    }
    grid.append(tile);
  }
}

function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('on'); setTimeout(()=>t.classList.remove('on'),1800); }

/* Put text in the box and sort it (used by the sample button and the Spotify import). */
function loadText(text){ $('songs').value = text; $('sort').click(); }

$('sort').onclick = () => {
  const parsed = parse($('songs').value);
  if(!parsed.length){ toast('Paste at least one song first'); return; }
  songs = parsed; render(); $('board').scrollIntoView({behavior:'smooth'});
};
$('sample').onclick = () => loadText(['Blinding Lights','Someone Like You','Walking on Sunshine','Levitating','Midnight City','Sunday Morning','Break Stuff','Yesterday','Dancing Queen','Skinny Love','Thunderstruck','Ocean Eyes','Dreams','Back in Black','Lost in Japan','Summer of 69'].join('\n'));

/* ---------- Share link (state lives in the URL hash, no server) ---------- */
function encode(){
  const data = {n:$('title').value, s:songs.map(s=>[s.t,s.v])};
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function decode(h){
  try{
    const d = JSON.parse(decodeURIComponent(escape(atob(h))));
    $('title').value = d.n || 'My mood board';
    songs = d.s.filter(x=>byId[x[1]]).map(x=>({t:String(x[0]).slice(0,90), v:x[1]}));
    render();
  }catch(e){}
}
$('link').onclick = async () => {
  const url = location.origin + location.pathname + '#' + encode();
  try{ await navigator.clipboard.writeText(url); toast('Link copied'); }
  catch(e){ prompt('Copy this link:', url); }
};
if(location.hash.length>1) decode(location.hash.slice(1));

/* ---------- PNG export (plain canvas, no libraries) ---------- */
function fit(ctx, text, maxW){
  if(ctx.measureText(text).width <= maxW) return text;
  while(text.length>1 && ctx.measureText(text+'…').width > maxW) text = text.slice(0,-1);
  return text+'…';
}
$('png').onclick = async () => {
  await document.fonts.ready;
  const FONT = '"Bricolage Grotesque", system-ui, sans-serif';
  const W=1200, pad=48, gap=20, cols=3, tw=(W-pad*2-gap*(cols-1))/cols, MAX=10, LH=32;
  const groups = VIBES.map(v=>({v, items:songs.filter(s=>s.v===v.id)})).filter(g=>g.items.length);
  const hOf = g => 96 + Math.min(g.items.length,MAX)*LH + (g.items.length>MAX?LH:0) + 20;
  const rows = []; for(let i=0;i<groups.length;i+=cols) rows.push(groups.slice(i,i+cols));
  const rowH = rows.map(r=>Math.max(...r.map(hOf)));
  const H = pad + 90 + rowH.reduce((a,b)=>a+b+gap,0) + pad - gap + 24;
  const c = document.createElement('canvas'); c.width=W*2; c.height=H*2;
  const x = c.getContext('2d'); x.scale(2,2);
  x.fillStyle='#F2F3F8'; x.fillRect(0,0,W,H);
  x.fillStyle='#1A1B33'; x.font='800 44px '+FONT; x.textBaseline='alphabetic';
  x.fillText(fit(x,$('title').value||'My mood board',W-pad*2), pad, pad+44);
  let y = pad + 90;
  rows.forEach((r,ri)=>{
    r.forEach((g,ci)=>{
      const tx = pad + ci*(tw+gap), th = rowH[ri];
      x.fillStyle = g.v.bg; x.beginPath(); x.roundRect(tx,y,tw,th,20); x.fill();
      x.fillStyle = g.v.fg; x.font='800 34px '+FONT; x.fillText(g.v.name, tx+22, y+52);
      x.font='400 16px '+FONT; x.globalAlpha=.75;
      x.fillText(g.items.length+(g.items.length===1?' song':' songs'), tx+22, y+78); x.globalAlpha=1;
      x.font='400 19px '+FONT;
      g.items.slice(0,MAX).forEach((s,i)=>{
        const ly = y+96+i*LH;
        x.globalAlpha=.3; x.fillRect(tx+22,ly,tw-44,1); x.globalAlpha=1;
        x.fillText(fit(x,s.t,tw-44), tx+22, ly+23);
      });
      if(g.items.length>MAX){ x.globalAlpha=.75; x.fillText('+ '+(g.items.length-MAX)+' more', tx+22, y+96+MAX*LH+23); x.globalAlpha=1; }
    });
    y += rowH[ri]+gap;
  });
  c.toBlob(b=>{
    const a=document.createElement('a'); a.href=URL.createObjectURL(b);
    a.download=($('title').value||'mood-board').replace(/[^\w-]+/g,'-').toLowerCase()+'.png'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
};
