/* Estadísticas v12.3 · universal · local-first · nube privada al compartir */
'use strict';

const APP_VERSION = 'v12.3';
const STORE = 'estadisticas_shared_v2'; // Compatibilidad: no renombrar ni borrar.
const MULTI_STORE = 'estadisticas_multiteam_v11';
const APP_CONFIG = window.ESTADISTICAS_CONFIG || {};
const teamLabel = () => state?.team?.name || 'Mi equipo';
const GENDERS={female:{singular:'Jugadora',plural:'Jugadoras',number:'N.º jugadora'},male:{singular:'Jugador',plural:'Jugadores',number:'N.º jugador'},neutral:{singular:'Jugador',plural:'Jugadores',number:'N.º jugador'}};
const genderTerms=()=>GENDERS[state?.team?.gender]||GENDERS.neutral;
const PALETTES={blue:{label:'Azul',light:['#155EEF','#C2410C'],dark:['#75A7FF','#FDBA74']},teal:{label:'Verde',light:['#087E6A','#7C3AED'],dark:['#5EEAD4','#C4B5FD']},purple:{label:'Morado',light:['#6D28D9','#B45309'],dark:['#C4B5FD','#FCD34D']},red:{label:'Rojo',light:['#C6283D','#1E5F9E'],dark:['#FF6B78','#7CC4FF']}};
function applyTeamIdentity(){const key=PALETTES[state?.team?.color]?state.team.color:'blue',theme=document.documentElement.dataset.theme==='dark'?'dark':'light',[own,rival]=PALETTES[key][theme];document.documentElement.style.setProperty('--team',own);document.documentElement.style.setProperty('--rival',rival);document.documentElement.dataset.teamColor=key;}
function detectGender(rows){const value=norm((rows||[]).flat(Infinity).join(' ')),female=/(^| )FEM( |$)|FEMENIN[OA]/.test(value),male=/(^| )MASC( |$)|MASCULIN[OA]/.test(value);return female&&!male?'female':male&&!female?'male':null;}
function applyDetectedGender(rows){const detected=detectGender(rows);if(detected&&(!state.team.gender||state.team.gender==='neutral')){state.team.gender=detected;save();return detected}return detected;}
function genderOptions(value='neutral',allowBlank=false){return `${allowBlank?'<option value="">Elige una opción</option>':''}<option value="female" ${value==='female'?'selected':''}>Femenino</option><option value="male" ${value==='male'?'selected':''}>Masculino</option><option value="neutral" ${value==='neutral'?'selected':''}>Mixto o neutro</option>`;}
function colorOptions(value='blue'){return Object.entries(PALETTES).map(([key,item])=>`<option value="${key}" ${key===value?'selected':''}>${item.label}</option>`).join('');}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, Number(n) || 0));
const num = (n, d = 1) => Number.isFinite(+n) ? (+n).toLocaleString('es-ES', {minimumFractionDigits:d, maximumFractionDigits:d}) : '—';
const pct = n => Number.isFinite(+n) ? `${num(n, 0)}%` : '—';
const signed = n => Number.isFinite(+n) ? `${+n > 0 ? '+' : ''}${num(n)}` : '—';
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const minutes = s => { if (typeof s === 'number') return s; const raw=String(s ?? '0').trim(); if (!raw.includes(':')) { const n=Number(raw.replace(',', '.')); return Number.isFinite(n) ? n : 0; } const [m, x] = raw.split(':').map(Number); return (m || 0) + (x || 0) / 60; };
const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const safeId = id => SAFE_ID.test(String(id ?? '')) ? String(id) : uid();
const safeDate = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d ?? '')) ? String(d) : '';
const fmtDate = d => { const v=safeDate(d); return v ? `${v.slice(8,10)}/${v.slice(5,7)}/${v.slice(0,4)}` : 'Sin fecha'; };
const safeNum = v => v === null || v === undefined || v === '' ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
const formatMinutes = v => { const total = Math.max(0, Math.round((+v || 0) * 60)); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`; };
const parseAI = s => { const [m, a] = String(s || '0/0').split('/').map(Number); return {m:m || 0, a:a || 0}; };
const sum = (arr, getter) => arr.reduce((a, x) => a + (+getter(x) || 0), 0);
const mean = (arr, getter) => arr.length ? sum(arr, getter) / arr.length : null;
const deepSignature = x => JSON.stringify(x);

/* ── State, migration and persistence ───────────────────────────── */
function blank(name = 'Mi equipo', season = '', gender = 'neutral', color = 'blue') {
  return {
    version: 12.3,
    team: {name, season, gender, color},
    roster: [], games: [], live: null,
    liveDraft: {rival:'', date:today(), dateManual:false, selected:[]},
    ops: [], lastSeq: 0,
    settings: {api:'', token:'', role:'admin', teamId:'', syncMode:'local', shotSide:'auto', shotColor:'por confirmar', rivalColor:'por confirmar'}
  };
}

function readStore(key){
  const raw=localStorage.getItem(key);if(!raw)return null;
  try{return JSON.parse(raw);}catch(error){console.warn(`Almacén dañado: ${key}`,error);try{localStorage.setItem(`${key}__danado_${Date.now()}`,raw);}catch(e){}return null;}
}
function loadWorkspaceBook() {
  try {
    const saved = readStore(MULTI_STORE);
    if (saved?.workspaces?.length) {
      if (!saved.workspaces.some(item => item.id === saved.activeId)) saved.activeId = saved.workspaces[0].id;
      return saved;
    }
    const legacy = readStore(STORE);
    if (legacy) {
      const id = uid();
      return {version:1, activeId:id, workspaces:[{id, name:legacy.team?.name || 'Mi equipo', data:legacy, legacy:true}]};
    }
    for (const key of ['estadisticas_v1', 'estadisticas_app_v1', 'basket_stats_v1']) {
      const old = readStore(key);
      if (old) {
        const id=uid(), data=migrateV1(old);
        return {version:1,activeId:id,workspaces:[{id,name:data.team?.name||'Mi equipo',data,legacy:true}]};
      }
    }
  } catch (error) { console.warn('No se pudo leer la lista de equipos', error); }
  const id=uid(), data=blank('Mi equipo','','neutral','blue');
  return {version:1,activeId:id,workspaces:[{id,name:data.team.name,data,legacy:true}]};
}
function activeWorkspace(){return workspaceBook.workspaces.find(item=>item.id===workspaceBook.activeId)||workspaceBook.workspaces[0];}
function load(){return sanitise(activeWorkspace()?.data || blank());}
function persistWorkspace(){
  const item=activeWorkspace(); if(!item)return;
  item.data=state;item.name=state.team.name||'Mi equipo';item.updatedAt=new Date().toISOString();
  try{
    localStorage.setItem(MULTI_STORE,JSON.stringify(workspaceBook));
    if(item.legacy)localStorage.setItem(STORE,JSON.stringify(state));
  }catch(error){console.error(error);setTimeout(()=>toast('El móvil no tiene espacio para guardar. Exporta una copia y libera espacio.'),0);}
}

let workspaceBook = loadWorkspaceBook();
let state = load();
let view = 'team';
let modalContext = null;
let fileMode = 'games';
let importPendingId = '';
let installPrompt = null;
let toastTimer;
let syncing = false;
let syncTimer;
let syncPromise = null;
let creatingTeam = false;
let creatingInvite = false;
let deletingTeam = false;
const ownEventIds = new Set();
function trackOwnEvent(id){if(!id)return;ownEventIds.add(id);if(ownEventIds.size>2000){const first=ownEventIds.values().next().value;ownEventIds.delete(first);}}
let renderAfterEdit = false;
let playerSort = 'pts';
let playerSortDir = -1;
let minutesScope = 'season';
let statsMode = 'average'; // average | total | compare
let modalReturnFocus = null;

function legacyPlayer(p = {}) {
  const p2 = parseAI(p.p2ai || p.twoAI || p.twoPoints || '0/0');
  const p3 = parseAI(p.p3ai || p.threeAI || p.threePoints || '0/0');
  const ft = parseAI(p.ftai || p.freeAI || p.freeThrows || '0/0');
  return {
    ...p,
    id: p.id || uid(), number: String(p.number ?? p.num ?? ''), name: String(p.name || '').trim(),
    min: Number.isFinite(+p.min) ? +p.min : minutes(p.minRaw || p.minutes), minRaw: p.minRaw || p.minutes || '',
    pts: +(p.pts ?? p.points) || 0,
    p2m: +(p.p2m ?? p.twoMade ?? p2.m) || 0, p2a: +(p.p2a ?? p.twoAttempted ?? p2.a) || 0,
    p3m: +(p.p3m ?? p.threeMade ?? p3.m) || 0, p3a: +(p.p3a ?? p.threeAttempted ?? p3.a) || 0,
    ftm: +(p.ftm ?? p.freeMade ?? ft.m) || 0, fta: +(p.fta ?? p.freeAttempted ?? ft.a) || 0,
    rebDef: +(p.rebDef ?? p.defReb) || 0, rebOff: +(p.rebOff ?? p.offReb) || 0,
    rebTot: +(p.rebTot ?? p.rebounds) || 0, ast: +(p.ast ?? p.assists) || 0,
    rec: +(p.rec ?? p.steals) || 0, per: +(p.per ?? p.turnovers) || 0,
    tapTc: +(p.tapTc ?? p.blocksMade) || 0, tapTr: +(p.tapTr ?? p.blocksReceived) || 0,
    fouls: +(p.fouls ?? p.fal ?? p.foulsCommitted) || 0,
    foulsDrawn: +(p.foulsDrawn ?? p.fr) || 0, val: +(p.val ?? p.rating) || 0, pm: +(p.pm ?? p.plusMinus) || 0,
    p2ai: `${+(p.p2m ?? p.twoMade ?? p2.m) || 0}/${+(p.p2a ?? p.twoAttempted ?? p2.a) || 0}`,
    p3ai: `${+(p.p3m ?? p.threeMade ?? p3.m) || 0}/${+(p.p3a ?? p.threeAttempted ?? p3.a) || 0}`,
    ftai: `${+(p.ftm ?? p.freeMade ?? ft.m) || 0}/${+(p.fta ?? p.freeAttempted ?? ft.a) || 0}`
  };
}

function hasLegacyFields(g) {
  return [...(g.players || []), ...(g.opponentPlayers || [])].some(p =>
    ['points','twoMade','threeMade','freeMade','minutes','fal','fr','rating','plusMinus'].some(k => Object.hasOwn(p, k))
  );
}

function sanitiseQuarters(list) {
  if (!Array.isArray(list)) return [];
  const map = new Map();
  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const rawQ = item.quarter ?? item.q ?? item.period ?? (index + 1);
    let qNum;
    if (typeof rawQ === 'number' && Number.isFinite(rawQ)) qNum = Math.trunc(rawQ);
    else {
      const s = String(rawQ || '').trim();
      const pr = s.match(/^PR\s*(\d+)/i);
      const dm = s.match(/\d+/);
      qNum = pr ? 4 + Number(pr[1]) : dm ? Number(dm[0]) : (index + 1);
    }
    if (!Number.isInteger(qNum) || qNum < 1 || qNum > 10) return;
    const us = safeNum(item.us ?? item.own ?? item.ownPoints ?? item.for);
    const them = safeNum(item.them ?? item.opponent ?? item.opponentPoints ?? item.opp ?? item.against);
    if (us === null || them === null || us < 0 || them < 0 || us > 200 || them > 200) return;
    map.set(qNum, {quarter:qNum, us:Math.trunc(us), them:Math.trunc(them)});
  });
  return [...map.values()].sort((a, b) => a.quarter - b.quarter);
}
const hasQuarterData = game => Array.isArray(game?.quarters) && game.quarters.length > 0;
const quarterGames = () => chronological(validGames().filter(hasQuarterData));
const quarterLabel = n => n <= 4 ? `Q${n}` : `PR${n - 4}`;
const quarterShort = n => n <= 4 ? `${n}º` : `PR${n - 4}`;

function sanitiseLive(live){
  if(!live||typeof live!=='object')return null;
  return {...live,id:safeId(live.id),opponent:String(live.opponent||'Rival'),date:safeDate(live.date)||today(),quarter:Math.min(10,Math.max(1,+live.quarter||1)),players:(Array.isArray(live.players)?live.players:[]).filter(p=>p&&typeof p==='object'&&p.name).map(p=>({...p,id:safeId(p.id),name:String(p.name),number:String(p.number||'')})),events:(Array.isArray(live.events)?live.events:[]).filter(e=>e&&typeof e==='object').map(e=>({...e,id:safeId(e.id),quarter:Math.min(10,Math.max(1,+e.quarter||1))}))};
}

function sanitise(s) {
  const base = blank();
  const out = {...base, ...s, version:12.3, team:{...base.team, ...(s.team || {})}, settings:{...base.settings, ...(s.settings || {})}};
  if(norm(out.team.name).includes('BUEN CONSEJO')){if(!s.team?.gender)out.team.gender='female';if(!s.team?.color)out.team.color='red';}
  if(!GENDERS[out.team.gender])out.team.gender='neutral';if(!PALETTES[out.team.color])out.team.color='blue';
  out.roster = (Array.isArray(s.roster) ? s.roster : []).filter(p => p && typeof p === 'object' && p.name).map(p => ({...p, id:safeId(p.id), name:String(p.name), number:String(p.number || '')}));
  out.games = (Array.isArray(s.games) ? s.games : []).filter(g => g && typeof g === 'object' && !g.demo && !g.isDemo && !['DEMO','EJEMPLO'].some(x => norm(g.opponent).includes(x))).map(g => {
    const pair = splitLegacyShots(g);
    const arr = v => Array.isArray(v) ? v : [];
    const players = arr(g.players).filter(p => p && typeof p === 'object' && p.name).map(legacyPlayer).map(p => ({...p, id:safeId(p.id)}));
    const opponentPlayers = arr(g.opponentPlayers || g.rivalPlayers).filter(p => p && typeof p === 'object' && p.name).map(legacyPlayer).map(p => ({...p, id:safeId(p.id)}));
    const events = arr(g.events).filter(e => e && typeof e === 'object' && !e.demo && !e.seed).map(e => ({...e, id:safeId(e.id), quarter:Math.min(10,Math.max(1,+e.quarter||1))}));
    const needsReimport = g.source !== 'live-pending' && (!!g.needsReimport || !opponentPlayers.length || !g.teamTotals || !g.opponentTotals || hasLegacyFields(g));
    const quarters = sanitiseQuarters(g.quarters);
    return {
      ...g, id:safeId(g.id), date:safeDate(g.date), us:safeNum(g.us), them:safeNum(g.them), opponent:String(g.opponent || 'Rival'), players, opponentPlayers,
      revision:Math.max(0,Number(g.revision)||0), updatedAt:String(g.updatedAt||g.importedAt||''), mapRevision:Math.max(0,Number(g.mapRevision)||0), mapUpdatedAt:String(g.mapUpdatedAt||''),
      livePlayerIds:arr(g.livePlayerIds).filter(id => SAFE_ID.test(String(id))),
      teamTotals:g.teamTotals ? legacyPlayer(g.teamTotals) : null,
      opponentTotals:g.opponentTotals ? legacyPlayer(g.opponentTotals) : null,
      events, quarters,
      shotsFor:pair.for, shotsAgainst:pair.against, shots:undefined,
      needsReimport,
      availability:{...(g.availability || {}), boxscore:players.length > 0, opponentBoxscore:opponentPlayers.length > 0, manual:events.some(e => !e.undone), shotMap:!!(pair.for.length || pair.against.length), quarters:quarters.length > 0}
    };
  });
  out.liveDraft = {...base.liveDraft, ...(s.liveDraft || {})};
  if (!Array.isArray(out.liveDraft.selected)) out.liveDraft.selected = [];
  // v9 persistía la fecha del Directo anterior. Solo conservamos una fecha
  // distinta de hoy cuando la persona la eligió de forma explícita en v10.
  if (!out.liveDraft.dateManual || !out.liveDraft.date) out.liveDraft.date = today();
  out.live = sanitiseLive(s.live);
  return out;
}

function migrateV1(old) {
  const out = blank();
  out.roster = (old.roster || old.players || []).filter(p => p?.name).map(p => ({id:p.id || uid(), number:p.number || p.num || '', name:p.name}));
  out.games = (old.games || old.matches || []).filter(g => g?.imported || g?.source === 'fbm' || g?.actaHash).map(g => ({...g, id:g.id || uid(), source:'fbm', needsReimport:true}));
  return sanitise(out);
}

function save() { state.version = 12.3; persistWorkspace(); }
function touchGame(game,{map=false}={}) { if(!game)return game;const stamp=new Date().toISOString();game.revision=Math.max(0,Number(game.revision)||0)+1;game.updatedAt=stamp;if(map){game.mapRevision=Math.max(0,Number(game.mapRevision)||0)+1;game.mapUpdatedAt=stamp;}return game; }
function record(type, payload) { if(type==='replace-game'&&payload?.game)touchGame(payload.game);state.ops.push({id:uid(), at:new Date().toISOString(), type, payload}); save(); paintSync(); scheduleSync(); }
function toast(message) { const t = $('#toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
function setView(next) { view = next; $$('[data-go]').forEach(b => b.setAttribute('aria-current', b.dataset.go === next ? 'page' : 'false')); render(); window.scrollTo(0, 0); }

function foldShots(points, mode = 'half', side = 'left') {
  return (points || []).map(p => {
    let x = +p.x, y = +p.y;
    if (mode === 'full' || p.fullCourt) {
      const shotSide = p.side || side || (x <= .5 ? 'left' : 'right');
      if (shotSide === 'right') return {x:clamp(1-y), y:clamp((1-x)*2), id:p.id || uid(), source:p.source || 'migrated'};
      return {x:clamp(y), y:clamp(x*2), id:p.id || uid(), source:p.source || 'migrated'};
    }
    return {x:clamp(x), y:clamp(y), id:p.id || uid(), source:p.source || 'manual'};
  });
}

function splitLegacyShots(g) {
  if (g.shotsFor || g.shotsAgainst) return {for:foldShots(g.shotsFor || []), against:foldShots(g.shotsAgainst || [])};
  const raw = g.shots || g.shotPoints || [], ownSide = g.sourceSide || 'left', mode = g.courtMode || 'half', own = [], against = [];
  raw.forEach(p => {
    const tag = String(p.team || p.kind || p.owner || '').toLowerCase();
    let mine = tag ? !(tag.includes('rival') || tag.includes('against') || tag.includes('opponent')) : true;
    if (mode === 'full' && !tag) mine = ownSide === 'left' ? +p.x <= .5 : +p.x >= .5;
    (mine ? own : against).push(p);
  });
  return {for:foldShots(own, mode, ownSide), against:foldShots(against, mode, ownSide === 'left' ? 'right' : 'left')};
}

/* ── FBM Excel import ───────────────────────────────────────────── */
async function readXlsx(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const text = async path => zip.file(path) ? zip.file(path).async('text') : '';
  const sharedDoc = new DOMParser().parseFromString(await text('xl/sharedStrings.xml'), 'application/xml');
  const shared = [...sharedDoc.querySelectorAll('si')].map(si => [...si.querySelectorAll('t')].map(t => t.textContent).join(''));
  const wbDoc = new DOMParser().parseFromString(await text('xl/workbook.xml'), 'application/xml');
  const relDoc = new DOMParser().parseFromString(await text('xl/_rels/workbook.xml.rels'), 'application/xml');
  const first = wbDoc.querySelector('sheet');
  const rid = first?.getAttribute('r:id') || first?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
  const rel = [...relDoc.querySelectorAll('Relationship')].find(x => x.getAttribute('Id') === rid);
  const target = rel?.getAttribute('Target') || 'worksheets/sheet1.xml';
  const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  const doc = new DOMParser().parseFromString(await text(path), 'application/xml');
  const rows = [];
  [...doc.querySelectorAll('row')].forEach(r => {
    const arr = [];
    [...r.querySelectorAll('c')].forEach(c => {
      const ref = c.getAttribute('r') || 'A1';
      const letters = ref.match(/[A-Z]+/)[0];
      let col = 0; for (const ch of letters) col = col * 26 + ch.charCodeAt(0) - 64; col--;
      const typ = c.getAttribute('t'), value = c.querySelector('v')?.textContent ?? '';
      const inline = [...c.querySelectorAll('is t')].map(x => x.textContent).join('');
      arr[col] = typ === 's' ? shared[+value] : typ === 'inlineStr' ? inline : value;
    });
    rows.push(arr);
  });
  return rows;
}

function parseRoster(rows) {
  const i = rows.findIndex(r => norm(r[0]) === 'APELLIDOS Y NOMBRE');
  if (i < 0) throw Error('No encuentro la tabla de la plantilla.');
  return rows.slice(i + 1).filter(r => r[0]).map(r => ({id:uid(), name:String(r[0]).trim(), number:''}));
}

function parseBoxRow(x, id) {
  const p2 = parseAI(x[4]), p3 = parseAI(x[6]), ft = parseAI(x[8]);
  return legacyPlayer({
    id, number:String(x[0] ?? ''), name:String(x[1] ?? '').trim(), min:minutes(x[2]), minRaw:String(x[2] ?? ''),
    pts:+x[3] || 0, p2m:p2.m, p2a:p2.a, p3m:p3.m, p3a:p3.a, ftm:ft.m, fta:ft.a,
    rebDef:+x[10] || 0, rebOff:+x[11] || 0, rebTot:+x[12] || 0, ast:+x[13] || 0,
    rec:+x[14] || 0, per:+x[15] || 0, tapTc:+x[16] || 0, tapTr:+x[17] || 0,
    fouls:+x[18] || 0, foulsDrawn:+x[19] || 0, val:+x[20] || 0, pm:+x[21] || 0
  });
}

function sumBox(players) {
  const keys = ['min','pts','p2m','p2a','p3m','p3a','ftm','fta','rebDef','rebOff','rebTot','ast','rec','per','tapTc','tapTr','fouls','foulsDrawn','val','pm'];
  const out = {id:'sum', number:'', name:'TOTALES'};
  keys.forEach(k => out[k] = sum(players, p => p[k]));
  out.minRaw = formatMinutes(out.min); out.p2ai = `${out.p2m}/${out.p2a}`; out.p3ai = `${out.p3m}/${out.p3a}`; out.ftai = `${out.ftm}/${out.fta}`;
  return out;
}

function validateTotals(players, total) {
  if (!total) return ['Falta la fila TOTALES'];
  const calculated = sumBox(players);
  const labels = {pts:'PTS', p2m:'2P anotados', p2a:'2P intentados', p3m:'3P anotados', p3a:'3P intentados', ftm:'TL anotados', fta:'TL intentados', fouls:'FAL', foulsDrawn:'FR', val:'VAL', rebDef:'REB DEF', rebOff:'REB OF', rebTot:'REB TOT', ast:'AST', rec:'REC', per:'PER', tapTc:'TAP', tapTr:'TAP R'};
  return Object.entries(labels).filter(([k]) => (+calculated[k] || 0) !== (+total[k] || 0)).map(([k, label]) => `${label}: filas ${calculated[k] || 0}, TOTALES ${total[k] || 0}`);
}

function parseGame(rows, fileName) {
  const title = rows.flat().find(x => String(x || '').startsWith('Estadísticas - '));
  if (!title) throw Error('No parece un acta FBM.');
  const groups = [];
  rows.forEach((r, i) => {
    if (norm(r[4]) !== 'TC 2P') return;
    const team = String(rows[i - 1]?.[0] || '').trim(), players = [];
    let total = null;
    for (let j = i + 2; j < rows.length; j++) {
      const x = rows[j] || [];
      if (norm(x[1]) === 'TOTALES') { total = parseBoxRow(x, `total-${groups.length}`); break; }
      if (x[1] && x[0] !== undefined && String(x[1]).trim()) players.push(parseBoxRow(x, uid()));
    }
    if (total) groups.push({team, score:+total.pts || 0, players, total, warnings:validateTotals(players, total)});
  });
  if (groups.length < 2) throw Error('El acta no contiene los dos equipos.');
  const label = norm(teamLabel()), exactOwn = groups.filter(g => norm(g.team) === label), partialOwn = groups.filter(g => norm(g.team).includes(label) || label.includes(norm(g.team)));
  const own = exactOwn.length === 1 ? exactOwn[0] : partialOwn.length === 1 ? partialOwn[0] : null, other = groups.find(g => g !== own);
  if (!own) { const error = Error(`No encuentro a ${teamLabel()} en el acta.`); error.code = 'NO_TEAM'; error.teams = groups.slice(0,2).map(g => g.team); throw error; }
  return {
    id:uid(), opponent:other.team, home:groups[0] === own, us:own.score, them:other.score,
    players:own.players, opponentPlayers:other.players, teamTotals:own.total, opponentTotals:other.total,
    importWarnings:[...(own.score === other.score ? ['Marcador empatado: en baloncesto no debería ocurrir. Revisa el Excel.'] : []), ...own.warnings.map(x => `${teamLabel()} · ${x}`), ...other.warnings.map(x => `${other.team} · ${x}`)],
    events:[], quarters:[], shotsFor:[], shotsAgainst:[], source:'fbm', fileName, date:today(), importedAt:new Date().toISOString(), needsReimport:false,
    availability:{boxscore:true, opponentBoxscore:true, manual:false, shotMap:false, quarters:false}
  };
}

let pendingImportFiles = null;
async function handleFiles(files) {
  pendingImportFiles = files;
  try {
    if (fileMode === 'roster') {
      const rows=await readXlsx(files[0]);applyDetectedGender(rows);const roster = parseRoster(rows);
      state.roster = mergeRoster(state.roster, roster);
      if (!state.liveDraft.selected.length) state.liveDraft.selected = state.roster.map(p => p.id);
      record('set-roster', {roster:state.roster,replace:true});
      toast(`${roster.length} ${genderTerms().plural.toLowerCase()} importad${state.team.gender==='female'?'as':'os'}`); render(); return;
    }
    const parsed = [];
    for (const file of files){const rows=await readXlsx(file);applyDetectedGender(rows);parsed.push(parseGame(rows,file.name));}
    modalContext = {type:'import', games:parsed, forcedPendingId:importPendingId};
    importPendingId = '';
    openModal('Importación', `${parsed.length} acta${parsed.length > 1 ? 's' : ''}`, `
      ${parsed.map((g, i) => `<article class="import-card">
        <div><b>${esc(g.opponent)}</b><span>${gameScore(g)} · ${g.home ? 'Casa' : 'Fuera'} · local–visitante · ${g.players.length} + ${g.opponentPlayers.length} personas en acta</span></div>
        <label>Fecha<input type="date" data-import-date="${i}" value="${g.date}"></label>
        ${pendingImportControl(g,i,modalContext.forcedPendingId)}
        ${g.importWarnings.length ? `<div class="data-warning"><b>Revisar Excel</b>${g.importWarnings.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : `<div class="validation-ok">✓ Filas y totales coinciden</div>`}
      </article>`).join('')}
      <div class="import-confirmation">Revisa la fecha y el Directo seleccionado. La unión conserva los eventos y evita duplicados.</div>
      <button class="btn primary wide" data-action="confirm-import">Guardar y unir lo seleccionado</button>`);
  } catch (error) {
    console.error(error);
    if (error.code === 'NO_TEAM' && error.teams?.length === 2 && state.settings.role !== 'viewer') {
      modalContext = {type:'pick-own-team'};
      return openModal('Importación', '¿Cuál es tu equipo?', `<p class="metric-explain">El acta no coincide con «${esc(teamLabel())}». Elige tu equipo; se guardará como nombre del equipo para las próximas actas.</p><div class="confirm-actions">${error.teams.map(name => `<button class="btn primary" data-action="pick-own-team" data-name="${esc(name)}">${esc(name)}</button>`).join('')}</div>`);
    }
    toast(error.message || 'No se pudo leer el Excel');
  }
}
function mergeRoster(current, incoming) {
  const map = new Map(current.map(p => [norm(p.name), p]));
  incoming.forEach(p => { const old = map.get(norm(p.name)); map.set(norm(p.name), old ? {...old, number:old.number || p.number} : p); });
  return [...map.values()];
}

function dateDistance(a,b) {
  const ax=Date.parse(`${a||''}T00:00:00Z`),bx=Date.parse(`${b||''}T00:00:00Z`);
  return Number.isFinite(ax)&&Number.isFinite(bx)?Math.abs(ax-bx)/86400000:Infinity;
}

function opponentAffinity(a,b) {
  const na=norm(a),nb=norm(b); if(!na||!nb)return 0;if(na===nb)return 1;
  if(na.includes(nb)||nb.includes(na))return .82;
  const ignored=new Set(['CLUB','CD','CB','CDE','CDSCM','BALONCESTO','BASKET','FEMENINO','FEM']);
  const words=value=>new Set(value.split(' ').filter(word=>word.length>2&&!ignored.has(word)));
  const aw=words(na),bw=words(nb);if(!aw.size||!bw.size)return 0;
  const common=[...aw].filter(word=>bw.has(word)).length;
  return common/Math.max(aw.size,bw.size);
}

function pendingScore(pending,game,chosenDate=game.date) {
  const name=opponentAffinity(pending.opponent,game.opponent),days=dateDistance(pending.date,chosenDate);
  const date=days===0?.55:days<=2?.4:days<=7?.25:0;
  return {pending,name,days,score:name+date};
}

function pendingCandidates(game,chosenDate=game.date,includeAll=false) {
  return state.games.filter(item=>item.source==='live-pending'&&item.id!==game.id).map(item=>pendingScore(item,game,chosenDate)).filter(item=>includeAll||(item.name>=.45&&item.days<=7)).sort((a,b)=>b.score-a.score||a.days-b.days);
}

function automaticPendingMatch(game,chosenDate=game.date) {
  const rows=pendingCandidates(game,chosenDate),first=rows[0],second=rows[1];
  return first&&first.score>=.78&&(!second||first.score-second.score>=.15)?first.pending:null;
}

function pendingImportControl(game,index,forcedId='') {
  const all=pendingCandidates(game,game.date,true),automatic=automaticPendingMatch(game,game.date);
  const selected=forcedId&&all.some(row=>row.pending.id===forcedId)?forcedId:automatic?.id||'';
  if(!all.length)return `<div class="import-match none"><b>Directo</b><span>No hay Directos pendientes.</span></div>`;
  return `<label class="import-match">Directo a unir<select data-import-pending="${index}"><option value="">No unir ningún Directo</option>${all.map(row=>{const item=row.pending,events=(item.events||[]).filter(event=>!event.undone).length;return `<option value="${item.id}" ${item.id===selected?'selected':''}>${esc(item.opponent)} · ${fmtDate(item.date)} · ${events} eventos${item.id===automatic?.id?' · recomendado':''}</option>`}).join('')}</select><small>${selected?'Se unirá el Directo indicado al guardar.':'No se unirá ningún Directo.'}</small></label>`;
}

function completeImportMatch(g,chosenDate='') {
  const exact=state.games.filter(x => norm(x.opponent) === norm(g.opponent) && hasScore(x.us) && hasScore(x.them) && +x.us === +g.us && +x.them === +g.them);
  const byDate=chosenDate&&exact.find(x=>x.date===chosenDate);
  if (byDate) return byDate;
  const near = exact.filter(x => !!x.home === !!g.home && dateDistance(x.date, chosenDate || g.date) <= 3);
  return near.length === 1 ? near[0] : null;
}

function eventKey(event) {
  return event.id||[event.type,event.quarter,event.playerId||norm(event.playerName),event.at||''].join('|');
}

function mergeEvents(...lists) {
  const map=new Map();lists.flat().filter(Boolean).forEach(event=>{const key=eventKey(event),prev=map.get(key);if(!prev)map.set(key,event);else if(event.undone&&!prev.undone)map.set(key,{...prev,undone:true});});return [...map.values()];
}

function mergeShots(a=[],b=[]) {
  const map=new Map();[...(a||[]),...(b||[])].forEach(p=>{const key=p.id||`${(+p.x).toFixed(3)}:${(+p.y).toFixed(3)}`;if(!map.has(key))map.set(key,p)});return [...map.values()];
}
function versionTuple(game,map=false){return map?[Math.max(0,Number(game?.mapRevision)||0),Date.parse(game?.mapUpdatedAt||'')||0]:[Math.max(0,Number(game?.revision)||0),Date.parse(game?.updatedAt||game?.importedAt||'')||0];}
function compareVersion(a,b,map=false){const av=versionTuple(a,map),bv=versionTuple(b,map);return av[0]-bv[0]||av[1]-bv[1];}
function mergeGameVersions(current,incoming){
  if(!current)return incoming;if(!incoming)return current;
  const newer=compareVersion(incoming,current)>=0?incoming:current,older=newer===incoming?current:incoming,merged={...older,...newer};
  merged.events=mergeEvents(current.events||[],incoming.events||[]);merged.livePlayerIds=[...new Set([...(current.livePlayerIds||[]),...(incoming.livePlayerIds||[])])];
  const mapOrder=compareVersion(incoming,current,true),cq=sanitiseQuarters(current.quarters),iq=sanitiseQuarters(incoming.quarters);
  if(mapOrder>0){merged.shotsFor=incoming.shotsFor||[];merged.shotsAgainst=incoming.shotsAgainst||[];merged.mapUpdatedAt=incoming.mapUpdatedAt||'';merged.quarters=iq;}
  else if(mapOrder<0){merged.shotsFor=current.shotsFor||[];merged.shotsAgainst=current.shotsAgainst||[];merged.mapUpdatedAt=current.mapUpdatedAt||'';merged.quarters=cq;}
  else{merged.shotsFor=mergeShots(current.shotsFor,incoming.shotsFor);merged.shotsAgainst=mergeShots(current.shotsAgainst,incoming.shotsAgainst);merged.mapUpdatedAt=(Date.parse(incoming.mapUpdatedAt||'')||0)>=(Date.parse(current.mapUpdatedAt||'')||0)?(incoming.mapUpdatedAt||current.mapUpdatedAt||''):(current.mapUpdatedAt||'');merged.quarters=(iq.length&&cq.length)?(newer===incoming?iq:cq):(iq.length?iq:cq);}
  merged.revision=Math.max(Number(current.revision)||0,Number(incoming.revision)||0);merged.mapRevision=Math.max(Number(current.mapRevision)||0,Number(incoming.mapRevision)||0);merged.availability={...(older.availability||{}),...(newer.availability||{}),manual:!!merged.events.some(event=>!event.undone),shotMap:!!(merged.shotsFor.length||merged.shotsAgainst.length),quarters:merged.quarters.length>0};return merged;
}
function mergeLiveVersions(current,incoming){if(!current||!incoming||current.id!==incoming.id)return incoming;return {...current,...incoming,events:mergeEvents(current.events||[],incoming.events||[])};}
function mergePendingIntoGame(pending,target) {
  if(!pending||!target||pending.id===target.id)return target;
  target.events=mergeEvents(target.events||[],pending.events||[]);
  target.shotsFor=mergeShots(target.shotsFor,pending.shotsFor);
  target.shotsAgainst=mergeShots(target.shotsAgainst,pending.shotsAgainst);
  target.quarters=sanitiseQuarters(target.quarters?.length?target.quarters:pending.quarters);
  target.livePlayerIds=[...new Set([...(target.livePlayerIds||[]),...(pending.livePlayerIds||[])])];
  target.availability={...(target.availability||{}),manual:(target.events||[]).some(e=>!e.undone),shotMap:!!((target.shotsFor||[]).length||(target.shotsAgainst||[]).length),quarters:target.quarters.length>0};
  state.games=state.games.filter(game=>game.id!==pending.id);
  return target;
}

function queueMerge(pending,target) {
  if(state.settings.role==='viewer')return;
  touchGame(target);state.ops.push({id:uid(),at:new Date().toISOString(),type:'merge-game',payload:{sourceId:pending.id,targetId:target.id,game:target}});
}

function repairPendingGames() {
  let changed=0;
  for(const pending of [...state.games.filter(game=>game.source==='live-pending')]){
    const candidates=validGames().map(game=>({...pendingScore(pending,game,game.date),game})).filter(item=>item.name>=.45&&item.days<=7).sort((a,b)=>b.score-a.score||a.days-b.days);
    const first=candidates[0],second=candidates[1];
    if(!first||first.score<1.2||(second&&first.score-second.score<.3))continue;
    mergePendingIntoGame(pending,first.game);queueMerge(pending,first.game);changed++;
  }
  if(changed)save();
  return changed;
}

function commitImport() {
  let joined=0;
  modalContext.games.forEach((g, i) => {
    const chosenDate = $(`[data-import-date="${i}"]`)?.value || '';
    const pendingId=$(`[data-import-pending="${i}"]`)?.value||'';
    const pending=state.games.find(game=>game.id===pendingId&&game.source==='live-pending');
    let existing = completeImportMatch(g,chosenDate);
    g.date = chosenDate;
    if(!existing&&pending)existing=pending;
    if(pending)joined++;
    if (existing) {
      const events=mergeEvents(existing.events||[],pending&&pending!==existing?pending.events||[]:[]),shotsFor=mergeShots(existing.shotsFor,pending&&pending!==existing?pending.shotsFor:[]),shotsAgainst=mergeShots(existing.shotsAgainst,pending&&pending!==existing?pending.shotsAgainst:[]),quarters=sanitiseQuarters(existing.quarters?.length?existing.quarters:pending?.quarters);
      Object.assign(existing, {...g, id:existing.id, date:g.date || existing.date, events, quarters, shotsFor, shotsAgainst, needsReimport:false,
        availability:{...g.availability, manual:events.some(e=>!e.undone), shotMap:!!(shotsFor.length || shotsAgainst.length), quarters:quarters.length > 0}});
      if(pending&&pending!==existing){mergePendingIntoGame(pending,existing);queueMerge(pending,existing);}
    } else state.games.push(g);
    const saved = existing || g;
    state.roster = mergeRoster(state.roster, g.players.map(player => ({id:player.id, number:player.number, name:player.name})));
    record('replace-game', {game:saved});
  });
  save(); scheduleSync(); closeModal(); toast(joined?`Actas guardadas · ${joined} Directo${joined===1?'':'s'} unido${joined===1?'':'s'}`:'Actas guardadas'); render();
}

/* ── Trusted statistics model ───────────────────────────────────── */
function effectiveTotals(g, side = 'own') {
  const players = side === 'own' ? (g.players || []) : (g.opponentPlayers || []);
  const total = side === 'own' ? g.teamTotals : g.opponentTotals;
  const calculated = sumBox(players);
  if (!total) return calculated;
  const out = {...calculated, ...total};
  for (const k of Object.keys(calculated)) if (out[k] === undefined || out[k] === null || out[k] === '') out[k] = calculated[k];
  return legacyPlayer(out);
}

function rosterPlayerForEvent(event) {
  return event?.playerId ? state.roster.find(player => player.id === event.playerId) || null : null;
}

function resolveEventPlayer(game, event) {
  const players = game?.players || [];
  if (!event || (!event.playerId && !event.playerName)) return null;
  const direct = event.playerId ? players.filter(player => player.id === event.playerId) : [];
  if (direct.length === 1) return direct[0];
  const rosterPlayer = rosterPlayerForEvent(event);
  for (const sourceName of [rosterPlayer?.name, event.playerName]) {
    const key = norm(sourceName);
    if (!key) continue;
    const matches = players.filter(player => norm(player.name) === key);
    if (matches.length === 1) return matches[0];
  }
  const number = String(rosterPlayer?.number || '').trim();
  if (number) {
    const matches = players.filter(player => String(player.number || '').trim() === number);
    if (matches.length === 1) return matches[0];
  }
  return null;
}

function eventCounts(g, p) {
  const events = (g.events || []).filter(event => !event.undone && (!p || resolveEventPlayer(g, event) === p));
  return {steals:events.filter(event => event.type === 'steal').length, turnovers:events.filter(event => event.type === 'turnover').length, orb:events.filter(event => event.type === 'orbFor').length, rivalOrb:events.filter(event => event.type === 'orbAgainst').length};
}

function unassignedEventCounts(g) {
  const events = (g.events || []).filter(event => !event.undone && !resolveEventPlayer(g, event));
  return {steals:events.filter(event => event.type === 'steal').length, turnovers:events.filter(event => event.type === 'turnover').length, orb:events.filter(event => event.type === 'orbFor').length, rivalOrb:events.filter(event => event.type === 'orbAgainst').length};
}

function hasScore(value) { return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)); }
function gameScore(game,separator='–') {
  const left=game.home?game.us:game.them,right=game.home?game.them:game.us;
  return `${left??'—'}${separator}${right??'—'}`;
}
function gameSides(game) { const team=teamLabel(); return game.home?`${team} · ${game.opponent}`:`${game.opponent} · ${team}`; }
function gameTime(game) { return `${game.date || '9999-12-31'}|${game.importedAt || ''}|${game.id || ''}`; }
function chronological(games) { return [...games].sort((a,b) => gameTime(a).localeCompare(gameTime(b))); }
function validGames() { return chronological(state.games.filter(g => g.source !== 'live-pending' && hasScore(g.us) && hasScore(g.them))); }
function hasManualData(game) { return !!(game?.availability?.manual || (game?.events || []).some(event => !event.undone)); }
function ratio(a,b) { return Number.isFinite(+a) && Number.isFinite(+b) && +b !== 0 ? +a / +b : null; }
function difference(a,b) { return Number.isFinite(+a) && Number.isFinite(+b) ? +a - +b : null; }
function noData(message='Sin datos registrados todavía') { return `<div class="no-data"><span>○</span><div><b>${esc(message)}</b><small>Los partidos sin registro no cuentan como 0 ni entran en medias o ratios.</small></div></div>`; }

function playerAgg() {
  const map = new Map();
  for (const g of validGames()) for (const p of g.players || []) {
    const k = norm(p.name);
    const x = map.get(k) || {id:p.id || k, name:p.name, number:p.number, gp:0, manualGp:0, games:[]};
    x.gp++;
    ['min','pts','p2m','p2a','p3m','p3a','ftm','fta','fouls','foulsDrawn','val','pm','ast','rec','per','rebDef','rebOff','rebTot'].forEach(q => x[q] = (+x[q] || 0) + (+p[q] || 0));
    const ec = eventCounts(g, p); x.steals = (+x.steals || 0) + ec.steals; x.turnovers = (+x.turnovers || 0) + ec.turnovers; x.orbLive = (+x.orbLive || 0) + ec.orb;
    if (hasManualData(g) && wasRecordedInLive(g,p)) x.manualGp++;
    x.games.push({g, p}); map.set(k, x);
  }
  state.roster.forEach(p => { const k = norm(p.name); if (!map.has(k)) map.set(k, {...p, gp:0, manualGp:0, games:[]}); });
  return [...map.values()].sort((a, b) => (b.gp ? b.pts / b.gp : -1) - (a.gp ? a.pts / a.gp : -1));
}

function teamStats() {
  const games = validGames();
  const own = games.map(g => effectiveTotals(g, 'own'));
  const opp = games.map(g => effectiveTotals(g, 'opp'));
  const played = games.length, wins = games.filter(g => g.us > g.them).length;
  const ev = games.flatMap(g => (g.events || []).filter(e => !e.undone));
  const agg = (rows, k) => sum(rows, p => p[k]);
  const ownPts = sum(games, g => g.us), oppPts = sum(games, g => g.them);
  const ftm = agg(own, 'ftm'), fta = agg(own, 'fta'), oftm = agg(opp, 'ftm'), ofta = agg(opp, 'fta');
  const p2 = agg(own, 'p2m'), p3 = agg(own, 'p3m'), op2 = agg(opp, 'p2m'), op3 = agg(opp, 'p3m');
  const playerTotals = playerAgg().filter(p => p.gp).sort((a, b) => b.pts - a.pts);
  const topScorer = playerTotals[0] || null;
  const topShare = ownPts && topScorer ? topScorer.pts / ownPts * 100 : null;
  const topThreePts = sum(playerTotals.slice(0, 3), p => p.pts);
  const topThreeShare = ownPts ? topThreePts / ownPts * 100 : null;
  const minuteSplit = games.map(g => {
    const ordered = [...(g.players || [])].sort((a, b) => b.min - a.min), first = ordered.slice(0, 5), rest = ordered.slice(5);
    return {first:sum(first, p => p.pts), rest:sum(rest, p => p.pts)};
  });
  const manualGames = games.filter(hasManualData);
  const scoreValues=games.map(game=>+game.us), marginValues=games.map(game=>+game.us-(+game.them));
  const deviation=values=>values.length?Math.sqrt(mean(values,value=>Math.pow(value-mean(values,item=>item),2))):null;
  return {
    games, own, opp, played, wins, losses:played - wins, ownPts, oppPts,
    ppg:played ? ownPts / played : null, papg:played ? oppPts / played : null, margin:played ? (ownPts - oppPts) / played : null,
    p2, p3, ftm, fta, ftp:fta ? ftm / fta * 100 : null, op2, op3, oftm, ofta, oftp:ofta ? oftm / ofta * 100 : null,
    fouls:agg(own, 'fouls'), foulsDrawn:agg(opp, 'fouls'), oppFouls:agg(opp, 'fouls'), oppFoulsDrawn:agg(own, 'fouls'),
    ast:agg(own, 'ast'), rec:agg(own, 'rec'), per:agg(own, 'per'), rebOff:agg(own, 'rebOff'), oppRebOff:agg(opp, 'rebOff'),
    shotRate:(p2 + p3) ? fta / (p2 + p3) : null, oppShotRate:(op2 + op3) ? ofta / (op2 + op3) : null,
    playerTotals, topScorer, topShare, topThreePts, topThreeShare, firstFivePts:sum(minuteSplit, x => x.first), restPts:sum(minuteSplit, x => x.rest),
    shotsFor:games.flatMap(g => g.shotsFor || []), shotsAgainst:games.flatMap(g => g.shotsAgainst || []),
    manualGames:manualGames.length, scoreDeviation:deviation(scoreValues), marginDeviation:deviation(marginValues),
    steals:ev.filter(e => e.type === 'steal').length, turnovers:ev.filter(e => e.type === 'turnover').length,
    orbLive:ev.filter(e => e.type === 'orbFor').length, oppOrbLive:ev.filter(e => e.type === 'orbAgainst').length
  };
}

function firstName(name) {
  const parts = String(name || '').split(',');
  const source = parts[1] || parts[0] || '';
  const first = source.trim().split(/\s+/)[0] || '—';
  return first[0]?.toUpperCase() + first.slice(1).toLowerCase();
}
function namePretty(name) { const [last, first] = String(name || '').split(','); return first ? `${title(first)} ${title(last)}` : title(last); }
function title(s) { return String(s || '').trim().toLowerCase().replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase()); }
function shortName(name) { const [last, first] = String(name || '').split(','); return `${firstName(name)} ${title(String(last || '').split(/\s+/)[0])}`.trim(); }

function sparkline(values, tone = 'team', width = 150, height = 42) {
  if (values.length > 12) values = values.slice(-12);
  const rows = values.map((value, index) => ({value:Number.isFinite(+value) ? +value : null, index}));
  const valid = rows.filter(row => row.value !== null);
  if (!valid.length) return '';
  const max = Math.max(...valid.map(row => row.value), 1);
  const min = Math.min(...valid.map(row => row.value), 0);
  const range = max - min || 1;
  const x = index => values.length === 1 ? width / 2 : index * width / (values.length - 1);
  const y = value => height - 5 - (value - min) / range * (height - 10);
  const segments = [];
  let segment = [];
  rows.forEach(row => {
    if (row.value === null) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push(`${x(row.index)},${y(row.value)}`);
  });
  if (segment.length) segments.push(segment);
  return `<svg class="spark ${tone}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    ${segments.map(points => `<polyline points="${points.join(' ')}"/>`).join('')}
    ${valid.map(row => `<circle cx="${x(row.index)}" cy="${y(row.value)}" r="2.6"/>`).join('')}
    ${rows.filter(row => row.value === null).map(row => `<circle class="missing" cx="${x(row.index)}" cy="${height - 5}" r="2.6"/>`).join('')}
  </svg>`;
}

function scoreChart(games, expanded = false) {
  if (!games.length) return '';
  const ordered = chronological(games);
  const all = ordered.flatMap(game => [+game.us, +game.them]);
  const max = Math.max(...all, 1), min = Math.min(...all, 0), w = ordered.length > 6 ? Math.max(760, ordered.length * (expanded ? 108 : 92)) : 760, h = expanded ? 300 : 250;
  const left=54,right=54;
  const x = index => ordered.length === 1 ? w / 2 : left + index * (w-left-right)/(ordered.length-1);
  const y = value => h-82-(value-min)/(max-min||1)*(h-132);
  const line = key => ordered.map((game,index)=>`${x(index)},${y(+game[key])}`).join(' ');
  const margins=ordered.map(game=>+game.us-(+game.them)), marginMax=Math.max(1,...margins.map(Math.abs));
  const marginBase=h-54, marginY=value=>marginBase-(value/marginMax)*16;
  const label=`${ordered.length} partido${ordered.length===1?'':'s'}${ordered.length>6?' · desliza ↔':''}`;
  return `<div class="score-chart-frame ${expanded?'expanded':''}"><div class="chart-window-label">${label}</div><div class="score-chart-scroller" data-detail="score-chart" tabindex="0" role="button" aria-label="Ampliar el gráfico completo"><svg class="score-chart" viewBox="0 0 ${w} ${h}" ${ordered.length>6||expanded?`style="min-width:${w}px!important"`:''} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Marcador y diferencia de ${ordered.length} partidos">
    <line class="grid-line" x1="26" y1="${marginBase}" x2="${w-26}" y2="${marginBase}"/><text class="axis-label" x="30" y="${Math.max(15,y(max)-7)}">máx ${max}</text><text class="axis-label" x="30" y="${Math.min(h-86,y(min)+15)}">mín ${min}</text>
    <polyline class="score-us" points="${line('us')}"/><polyline class="score-them" points="${line('them')}"/>
    <polyline class="score-difference" points="${margins.map((value,index)=>`${x(index)},${marginY(value)}`).join(' ')}"/>
    ${ordered.map((game,index)=>{const margin=+game.us-(+game.them),yu=y(+game.us),yt=y(+game.them),close=Math.abs(yu-yt)<32,ux=x(index)+(close?-15:0),tx=x(index)+(close?15:0);return `<g data-detail="game:${game.id}" tabindex="0" role="button">
      <circle class="score-us" cx="${x(index)}" cy="${yu}" r="7"/><circle class="score-them" cx="${x(index)}" cy="${yt}" r="7"/>
      <text class="score-label us" x="${ux}" y="${Math.max(20,yu-16)}" text-anchor="middle">${game.us}</text>
      <text class="score-label them" x="${tx}" y="${Math.min(h-86,yt+27)}" text-anchor="middle">${game.them}</text>
      <text class="score-margin ${margin>=0?'positive':'negative'}" x="${x(index)}" y="${h-29}" text-anchor="middle">${margin>0?'+':''}${margin}</text>
      <text class="game-label" x="${x(index)}" y="${h-18}" text-anchor="middle">P${index+1}</text>
      <text class="date-label" x="${x(index)}" y="${h-4}" text-anchor="middle">${esc(String(game.date||'').slice(5))}</text>
      <title>${esc(gameSides(game))}: ${gameScore(game)} · diferencia ${margin>0?'+':''}${margin}</title></g>`;}).join('')}
  </svg></div><div class="chart-legend"><span class="us">${esc(teamLabel())}</span><span class="them">Rival</span><span class="margin">Diferencia</span></div></div>`;
}

function scoreOverviewSVG(games){
  const rows=chronological(games),values=rows.flatMap(game=>[+game.us,+game.them]),min=Math.min(0,...values),max=Math.max(1,...values),w=760,h=118,x=index=>rows.length===1?w/2:18+index*(w-36)/(rows.length-1),y=value=>h-17-(value-min)/(max-min||1)*(h-34),line=key=>rows.map((game,index)=>`${x(index)},${y(game[key])}`).join(' ');
  return `<div class="score-overview"><span>Temporada completa · ${rows.length} partidos</span><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Vista completa de la temporada"><polyline class="score-us" points="${line('us')}"/><polyline class="score-them" points="${line('them')}"/>${rows.map((game,index)=>`<circle class="${game.us>=game.them?'win':'loss'}" cx="${x(index)}" cy="${y(game.us)}" r="${rows.length>16?3:5}"/>`).join('')}</svg></div>`;
}
function openScoreChartDetail(){
  const games=chronological(validGames());
  const best=[...games].sort((a,b)=>(b.us-b.them)-(a.us-a.them))[0], worst=[...games].sort((a,b)=>(a.us-a.them)-(b.us-b.them))[0];
  modalContext={type:'score-chart'};
  openModal('Equipo','Marcador completo',`<p class="metric-explain">Todos los partidos, sin comprimir. La vista superior enseña la temporada completa; debajo puedes deslizar el detalle y tocar un punto para abrir el acta.</p>${scoreOverviewSVG(games)}${scoreChart(games,true)}<div class="best-worst"><div><span>Mayor diferencia</span><b>${best?signed(best.us-best.them).replace(',0',''):'—'}</b><small>${best?esc(best.opponent):''}</small></div><div><span>Menor diferencia</span><b>${worst?signed(worst.us-worst.them).replace(',0',''):'—'}</b><small>${worst?esc(worst.opponent):''}</small></div></div><section class="detail-block"><h3>Partido a partido</h3><div class="player-games">${games.map((game,index)=>`<button data-detail="game:${game.id}"><span><b>P${index+1} · ${esc(game.opponent)}</b><small>${fmtDate(game.date)} · ${game.home?'Casa':'Fuera'}</small></span><strong>${gameScore(game)}</strong><em>${signed(game.us-game.them).replace(',0','')}</em></button>`).join('')}</div></section>`);
  requestAnimationFrame(()=>{const scroller=$('.modal .score-chart-scroller');if(scroller)scroller.scrollLeft=scroller.scrollWidth;});
}

function pointShareChart(players, ownPts) {
  const shown = players.slice(0, 5), rest = Math.max(0, ownPts - sum(shown, p => p.pts));
  const max = Math.max(1, ...shown.map(p => p.pts), rest);
  const rows = [...shown.map(p => ({name:shortName(p.name), value:p.pts, key:norm(p.name)})), ...(rest ? [{name:'Resto', value:rest}] : [])];
  return `<div class="share-bars">${rows.map(row => `<button ${row.key ? `data-detail="player:${encodeURIComponent(row.key)}"` : ''}><span>${esc(row.name)}</span><i><b style="width:${row.value/max*100}%"></b></i><strong>${row.value} · ${pct(ownPts ? row.value/ownPts*100 : 0)}</strong></button>`).join('')}</div>`;
}

function minuteRows(players, scope = 'season') {
  if (scope.startsWith('game:')) {
    const game = validGames().find(item => item.id === scope.slice(5));
    return (game?.players || []).map(player => ({...player, display:+player.min || 0, gamesPlayed:1})).sort((a,b) => b.display-a.display);
  }
  return players.map(player => ({...player, display:scope === 'average' ? player.min / Math.max(1, player.gp) : player.min, gamesPlayed:player.gp})).sort((a,b) => b.display-a.display);
}

function minuteBars(players, scope = 'season', limit = 9) {
  const rows = minuteRows(players, scope).slice(0, limit), max = Math.max(1, ...rows.map(player => player.display));
  return `<div class="minute-bars">${rows.map(player => `<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><i><b style="width:${player.display/max*100}%"></b></i><strong>${formatMinutes(player.display)}</strong></button>`).join('')}</div>`;
}

function stackedBar(items, label) {
  const total = sum(items, item => item.value) || 1;
  return `<div class="stacked-chart" role="img" aria-label="${esc(label)}"><div>${items.map(item => `<i class="${item.tone}" style="width:${item.value/total*100}%" title="${esc(item.label)}: ${item.value}"></i>`).join('')}</div><ul>${items.map(item => `<li><span class="dot ${item.tone}"></span><b>${esc(item.label)}</b><strong>${num(item.value/total*100,0)}%</strong></li>`).join('')}</ul></div>`;
}

function scoringMixCompare(own, opp) {
  const row = (label, totals, side) => {
    const parts = [{label:'2P', value:totals.p2m*2, tone:'two'}, {label:'3P', value:totals.p3m*3, tone:'three'}, {label:'TL', value:totals.ftm, tone:'free'}];
    return `<div class="mix-row"><div><b>${esc(label)}</b><span>${sum(parts, item => item.value)} pts</span></div>${stackedBar(parts, `Origen de puntos · ${label}`)}</div>`;
  };
  return `<div class="mix-compare">${row(teamLabel(), own, 'own')}${row('Rival', opp, 'opp')}</div>`;
}

function compareBar(label, own, opp, formatter = num) {
  const max = Math.max(+own || 0, +opp || 0, 1);
  return `<div class="compare-row"><span>${label}</span><div class="compare-values"><b>${formatter(own)}</b><b>${formatter(opp)}</b></div><div class="compare-track"><i class="own" style="width:${(+own||0)/max*100}%"></i><i class="opp" style="width:${(+opp||0)/max*100}%"></i></div></div>`;
}

function donut(value, label, tone = 'team') {
  const v = clamp((+value || 0) / 100) * 100;
  return `<div class="donut ${tone}" style="--p:${v}" role="img" aria-label="${esc(label)}: ${num(v,0)} por ciento"><div><strong>${num(v,0)}%</strong><span>${esc(label)}</span></div></div>`;
}

const TEAM_METRICS = {
  points:{label:'Puntos', short:'PTS', player:'pts', compare:true, higherBetter:true, value:(game, totals, side) => side === 'own' ? +game.us : +game.them, note:'Marcador oficial.'},
  margin:{label:'Diferencia', short:'+/-', compare:false, signed:true, higherBetter:true, value:(game) => +game.us-(+game.them), note:'Un único margen con signo: puntos de mi equipo menos puntos del rival.'},
  p2m:{label:'Canastas de 2', short:'2P', player:'p2m', compare:true, higherBetter:true, value:(game, totals) => +totals.p2m || 0, note:'Canastas anotadas; no porcentaje porque los intentos de campo del acta no son fiables.'},
  p3m:{label:'Canastas de 3', short:'3P', player:'p3m', compare:true, higherBetter:true, value:(game, totals) => +totals.p3m || 0, note:'Triples anotados; las líneas coincidentes se separan y el rival se dibuja discontinuo.'},
  ftm:{label:'Tiros libres', short:'TL', player:'ftm', compare:true, higherBetter:true, value:(game, totals) => +totals.ftm || 0, note:'Tiros libres anotados.'},
  fta:{label:'TL intentados', short:'TLI', player:'fta', compare:true, higherBetter:true, value:(game, totals) => +totals.fta || 0, note:'Intentos de tiro libre; aproxima la presión sobre el aro sin inventar posesiones.'},
  ftp:{label:'Porcentaje TL', short:'TL%', player:'ftp', compare:true, percent:true, higherBetter:true, value:(game, totals) => totals.fta ? totals.ftm/totals.fta*100 : null, note:'Los partidos sin intentos quedan ausentes: no cuentan como 0% ni entran en la media.'},
  threeShare:{label:'Peso del triple', short:'3P PTS%', compare:true, percent:true, higherBetter:null, value:(game, totals, side) => {const pts=side==='own'?+game.us:+game.them;return pts?3*(+totals.p3m||0)/pts*100:null;}, note:'Porcentaje de los puntos que procede de triples. Describe el estilo, no si es mejor o peor.'},
  freeShare:{label:'Peso del tiro libre', short:'TL PTS%', compare:true, percent:true, higherBetter:null, value:(game, totals, side) => {const pts=side==='own'?+game.us:+game.them;return pts?(+totals.ftm||0)/pts*100:null;}, note:'Porcentaje de los puntos que procede del tiro libre. Describe el estilo anotador.'},
  fouls:{label:'Faltas', short:'FAL', player:'fouls', compare:true, lowerBetter:true, per40:true, value:(game, totals) => +totals.fouls || 0, note:'Faltas cometidas. Menos es mejor; las faltas del rival equivalen a faltas recibidas por el equipo.'},
  val:{label:'Valoración', short:'VAL', player:'val', compare:true, higherBetter:true, value:(game, totals) => +totals.val || 0, note:'Valoración publicada en el acta. La tarjeta principal conserva la referencia rival.'},
  ast:{label:'Asistencias', short:'AST', player:'ast', compare:true, optional:true, higherBetter:true, value:(game, totals) => +totals.ast || 0, note:'Asistencias publicadas en el acta. Solo aparece cuando el Excel contiene valores.'},
  rebTot:{label:'Rebotes totales', short:'REB', player:'rebTot', compare:true, optional:true, higherBetter:true, value:(game, totals) => +totals.rebTot || 0, note:'Rebotes totales publicados en el acta. Solo aparece cuando el Excel contiene valores fiables.'},
  rebOff:{label:'Rebotes ofensivos · acta', short:'REB O', player:'rebOff', compare:true, optional:true, higherBetter:true, value:(game, totals) => +totals.rebOff || 0, note:'Rebotes ofensivos publicados en el acta; no se mezclan con Directo.'},
  rec:{label:'Recuperaciones · acta', short:'REC', player:'rec', compare:true, optional:true, higherBetter:true, value:(game, totals) => +totals.rec || 0, note:'Recuperaciones publicadas en el acta; no se mezclan con los robos de Directo.'},
  per:{label:'Pérdidas · acta', short:'PER', player:'per', compare:true, optional:true, lowerBetter:true, value:(game, totals) => +totals.per || 0, note:'Pérdidas publicadas en el acta; no se mezclan con Directo.'}
};

function availableTeamMetricKeys() {
  return Object.keys(TEAM_METRICS).filter(key => {
    const metric = TEAM_METRICS[key];
    if (!metric.optional) return true;
    return validGames().some(game => {
      const own = effectiveTotals(game,'own'), opp = effectiveTotals(game,'opp');
      return (+own[metric.player] || 0) !== 0 || (+opp[metric.player] || 0) !== 0;
    });
  });
}

function teamMetricRows(key) {
  const metric = TEAM_METRICS[key];
  return chronological(validGames()).map(game => ({
    game,
    own:metric.value(game, effectiveTotals(game,'own'), 'own'),
    opp:metric.value(game, effectiveTotals(game,'opp'), 'opp')
  }));
}

function aggregateMetric(key, rows, side, mode = 'average') {
  if (key === 'ftp' && mode === 'total') {
    const totals = rows.reduce((out, row) => {
      const total = effectiveTotals(row.game, side === 'own' ? 'own' : 'opp');
      out.made += total.ftm || 0; out.attempted += total.fta || 0; return out;
    }, {made:0, attempted:0});
    return totals.attempted ? totals.made/totals.attempted*100 : null;
  }
  if (['threeShare','freeShare'].includes(key) && mode === 'total') {
    const points=sum(rows,row=>side==='own'?row.game.us:row.game.them);
    const made=sum(rows,row=>{const total=effectiveTotals(row.game,side==='own'?'own':'opp');return key==='threeShare'?(+total.p3m||0)*3:(+total.ftm||0)});
    return points?made/points*100:null;
  }
  const values = rows.map(row => row[side]).filter(value => value !== null && Number.isFinite(+value));
  if (!values.length) return null;
  return mode === 'total' ? sum(values, value => value) : mean(values, value => value);
}

function metricValue(key, value, digits = 1) {
  if (key === 'margin' || key === 'possession') return signed(value).replace(',0','');
  return (key === 'ftp' || TEAM_METRICS[key]?.percent) ? pct(value) : num(value, digits);
}

function dualTrendSVG(rows, key, compact = false) {
  if (compact && rows.length > 12) rows = rows.slice(-12);
  const valid = rows.flatMap(row => [row.own,row.opp]).filter(value => value !== null && Number.isFinite(+value));
  if (!valid.length) return '<div class="empty-chart">Sin datos</div>';
  const w=compact?760:Math.max(760,rows.length*76), h=compact?116:270, left=compact?10:42, bottom=compact?12:42;
  const min=Math.min(0,...valid), max=Math.max(1,...valid);
  const x=index => rows.length===1?w/2:left+index*(w-left*2)/(rows.length-1);
  const y=value => h-bottom-(value-min)/(max-min||1)*(h-bottom-(compact?10:30));
  const adjustedY = (row,side) => y(+row[side]) + (!compact && row.own !== null && row.opp !== null && +row.own === +row.opp ? (side === 'own' ? -5 : 5) : 0);
  const separatedSegments = side => { const segments=[]; let segment=[]; rows.forEach((row,index)=>{const value=row[side];if(value===null||!Number.isFinite(+value)){if(segment.length)segments.push(segment);segment=[];}else segment.push(`${x(index)},${adjustedY(row,side)}`)});if(segment.length)segments.push(segment);return segments; };
  const lines = side => separatedSegments(side).map(points => `<polyline class="${side}" points="${points.join(' ')}"/>`).join('');
  const label=(TEAM_METRICS[key]||LIVE_METRICS[key]||{}).label||key;
  return `<svg class="dual-trend ${compact?'compact':''}" viewBox="0 0 ${w} ${h}" ${compact?'':`style="min-width:${Math.max(0,rows.length*72)}px"`} role="img" aria-label="Evolución de ${esc(label)}">
    ${compact?'':`<line class="trend-grid zero-line" x1="${left-12}" y1="${y(0)}" x2="${w-left+12}" y2="${y(0)}"/><text class="axis-label" x="${left-8}" y="${Math.max(13,y(max)-6)}">máx ${metricValue(key,max)}</text><text class="axis-label" x="${left-8}" y="${Math.min(h-bottom-3,y(min)+14)}">mín ${metricValue(key,min)}</text><text class="axis-label zero-label" x="${w-left+8}" y="${Math.max(13,y(0)-6)}" text-anchor="end">0</text><line class="trend-axis" x1="${left-12}" y1="${h-bottom}" x2="${w-left+12}" y2="${h-bottom}"/>`}${lines('own')}${lines('opp')}
    ${rows.map((row,index) => `<g ${compact?'':`data-detail="game:${row.game.id}" tabindex="0" role="button"`}>
      ${row.own===null?'':`<circle class="own" cx="${x(index)}" cy="${adjustedY(row,'own')}" r="${compact?4:7}"/>`}${row.opp===null?'':`<circle class="opp" cx="${x(index)}" cy="${adjustedY(row,'opp')}" r="${compact?4:7}"/>`}
      ${compact?'':`<text x="${x(index)}" y="${h-13}" text-anchor="middle">P${index+1}</text><title>${esc(row.game.opponent)} · ${esc(teamLabel())} ${metricValue(key,row.own)} · Rival ${metricValue(key,row.opp)}</title>`}
    </g>`).join('')}
  </svg>`;
}

function pairedBarsVisual(key, rows) {
  const own=aggregateMetric(key,rows,'own'), opp=aggregateMetric(key,rows,'opp'), max=Math.max(+own||0,+opp||0,1);
  return `<div class="paired-bars"><div><span>${esc(teamLabel())}</span><i><b class="own" style="width:${(+own||0)/max*100}%"></b></i></div><div><span>Rival</span><i><b class="opp" style="width:${(+opp||0)/max*100}%"></b></i></div></div>`;
}

function balanceVisual(key, rows) {
  const shown=rows.length>10?rows.slice(-10):rows,delta=row=>key==='margin'?(+row.own||0):(difference(row.own,row.opp)||0),max=Math.max(1,...shown.map(row=>Math.abs(delta(row)))),metric=TEAM_METRICS[key]||{};
  return `<div class="balance-mini diverging" aria-label="Diferencia entre mi equipo y el rival: arriba ventaja, abajo desventaja">${shown.map(row=>{const d=delta(row),good=metric.lowerBetter?d<=0:d>=0,h=Math.max(3,Math.abs(d)/max*50);return `<span class="div-col" title="${esc(row.game?.opponent||'')} ${d>0?'+':''}${num(d,key==='margin'||key==='possession'?0:1)}"><i class="${good?'positive':'negative'} ${d>=0?'up':'down'}" style="height:${h}%"></i></span>`}).join('')}</div>`;
}

function metricMiniVisual(key, rows, mode=statsMode) {
  let visual;
  if (key==='margin') visual=balanceVisual(key,rows);
  else if (rows.length===1 || mode==='total') visual=pairedBarsVisual(key,rows);
  else if (mode==='compare') visual=balanceVisual(key,rows);
  else visual=dualTrendSVG(rows,key,true);
  const kind=key==='margin'||mode==='compare'?'balance':(rows.length===1||mode==='total')?'barras':'evolución';
  return `<div class="metric-evolution visual-${kind}" aria-label="Vista de ${kind}">${visual}</div>`;
}

function teamMetricCard(key) {
  const metric=TEAM_METRICS[key], rows=teamMetricRows(key);
  const ownAverage=aggregateMetric(key,rows,'own'), oppAverage=aggregateMetric(key,rows,'opp');
  const ownTotal=aggregateMetric(key,rows,'own','total'), oppTotal=aggregateMetric(key,rows,'opp','total');
  const mode = ['ftp','threeShare','freeShare'].includes(key) ? 'total' : statsMode;
  const ownShown = mode === 'total' ? ownTotal : ownAverage, oppShown = mode === 'total' ? oppTotal : oppAverage;
  const modeLabel = ['ftp','threeShare','freeShare'].includes(key) ? 'temporada' : mode === 'total' ? 'total' : mode==='compare'?'diferencia media':'por partido';
  const detail = key === 'ftp' ? `TL ${sum(rows,row=>effectiveTotals(row.game,'own').ftm)}/${sum(rows,row=>effectiveTotals(row.game,'own').fta)}` : '';
  if (key==='margin') return `<button class="stat-card stat-margin single-value-card" data-detail="metric:margin"><header><span>Diferencia</span><small>${esc(teamLabel())} − Rival</small></header><div class="comparison-value"><strong>${metricValue(key,ownShown,mode==='total'?0:1)}</strong><span>${modeLabel}</span></div>${metricMiniVisual(key,rows,statsMode)}<footer><b>Ver detalle →</b></footer></button>`;
  if (statsMode==='compare' && metric.compare) {const delta=difference(ownAverage,oppAverage),shown=metric.percent?`${signed(delta)} pp`:signed(delta);return `<button class="stat-card stat-${key} comparison-card" data-detail="metric:${key}"><header><span>${metric.label}</span><small>${esc(teamLabel())} − Rival</small></header><div class="comparison-value"><strong>${shown}</strong><span>por partido</span></div>${metricMiniVisual(key,rows,statsMode)}<footer><b>Ver detalle →</b></footer></button>`;}
  if (!metric.compare) return `<button class="stat-card stat-${key}" data-detail="metric:${key}"><header><span>${metric.label}</span><small>${esc(teamLabel())}</small></header><div class="stat-values own-only"><strong>${metricValue(key,ownShown,mode==='total'?0:1)}</strong><span>${modeLabel}</span></div>${metricMiniVisual(key,rows,statsMode)}<footer>${detail?`<span>${detail}</span>`:''}<b>Ver detalle →</b></footer></button>`;
  const hint=metric.lowerBetter?`${esc(teamLabel())} / Rival · menos`:`${esc(teamLabel())} / Rival`;
  return `<button class="stat-card stat-${key}" data-detail="metric:${key}"><header><span>${metric.label}</span><small>${hint}</small></header><div class="stat-values"><strong>${metricValue(key,ownShown,mode==='total'?0:1)}</strong><strong>${metricValue(key,oppShown,mode==='total'?0:1)}</strong></div><div class="value-caption"><span>${esc(teamLabel())}</span><span>Rival</span></div>${metricMiniVisual(key,rows,statsMode)}<footer>${detail?`<span>${detail}</span>`:''}<b>Ver detalle →</b></footer></button>`;
}

function head(cls, title, actions = '', meta = '') {
  return `<section class="${cls}"><header class="page-head"><div><h1>${title}</h1>${meta ? `<p>${esc(meta)}</p>` : ''}</div><div class="action-row">${actions}</div></header>`;
}

function reimportBanner() {
  const n = state.games.filter(g => g.needsReimport).length;
  return n ? `<div class="reimport-banner"><span class="warning-mark">!</span><div><b>Faltan datos del rival en ${n} partido${n > 1 ? 's' : ''}</b><span>Vuelve a importar ${n > 1 ? 'las actas' : 'el acta'}. Se conservan fecha, Directo y mapas.</span></div><button class="btn" data-action="import-games">Reimportar</button></div>` : '';
}

function renderMinutesCard(stats) {
  const options = [`<option value="season" ${minutesScope==='season'?'selected':''}>Temporada</option>`, `<option value="average" ${minutesScope==='average'?'selected':''}>Media por partido</option>`, ...stats.games.map((game,index)=>`<option value="game:${game.id}" ${minutesScope===`game:${game.id}`?'selected':''}>P${index+1} · ${esc(game.opponent)}</option>`)].join('');
  const label = minutesScope === 'season' ? 'Minutos totales' : minutesScope === 'average' ? 'Media por partido' : 'Partido concreto';
  return `<article class="card visual-card minutes-card"><div class="card-title"><div><h3>Minutos</h3><span>${label}</span></div><select id="minutesScope" aria-label="Vista de minutos">${options}</select></div><div class="minutes-open">${minuteBars(stats.playerTotals,minutesScope)}</div><button class="text-link" data-detail="minutes">Ver ${genderTerms().plural.toLowerCase()}: ${playerAgg().length}, mapa y evolución →</button></article>`;
}

const LIVE_METRICS = {
  ball:{label:'Robos y pérdidas', ownLabel:'Robos', oppLabel:'Pérdidas', types:['steal','turnover'], note:'Compara los robos con las pérdidas de mi equipo.'},
  orb:{label:'Rebote ofensivo', ownLabel:'REB O propio', oppLabel:'REB O rival', types:['orbFor','orbAgainst'], note:'Solo usa los rebotes ofensivos apuntados en Directo.'},
  possession:{label:'Posesiones extra', ownLabel:'Ventaja de posesiones', oppLabel:'', types:[], note:'(REB O propios + robos) − (REB O rival + pérdidas propias). Solo cuenta partidos con Directo.'}
};

function recordedLiveGames() {
  return validGames().filter(hasManualData);
}

function liveMetricRows(key) {
  const metric=LIVE_METRICS[key];
  return chronological(recordedLiveGames()).map(game=>{
    const events=(game.events||[]).filter(event=>!event.undone),count=type=>events.filter(event=>event.type===type).length;
    if(key==='possession')return {game,own:(count('orbFor')+count('steal'))-(count('orbAgainst')+count('turnover')),opp:null};
    return {game,own:count(metric.types[0]),opp:count(metric.types[1])};
  });
}

function liveMetricCard(key) {
  const metric=LIVE_METRICS[key],rows=liveMetricRows(key),ownTotal=sum(rows,row=>row.own),oppTotal=sum(rows,row=>row.opp),ownAvg=mean(rows,row=>row.own),oppAvg=mean(rows,row=>row.opp);
  if(!rows.length)return '';
  const compareMode=statsMode==='compare',totalMode=statsMode==='total',own=totalMode?ownTotal:ownAvg,opp=totalMode?oppTotal:oppAvg;
  if(key==='possession'){const shown=totalMode?ownTotal:ownAvg,label=totalMode?'total':'por partido',visual=balanceVisual('possession',rows);return `<button class="stat-card live-stat-card possession-card single-value-card" data-detail="live:possession"><header><span>${metric.label}</span><small>Directo</small></header><div class="comparison-value"><strong>${metricValue('possession',shown,totalMode?0:1)}</strong><span>${label}</span></div><div class="metric-evolution visual-balance">${visual}</div><footer><b>Ver detalle →</b></footer></button>`;}
  const share=(ownTotal+oppTotal)?ownTotal/(ownTotal+oppTotal)*100:null, relation=ratio(ownTotal,oppTotal),balance=ownTotal-oppTotal;
  const insight=key==='ball'?`Ratio ${relation===null?'—':num(relation,2)}`:`Cuota ${share===null?'—':pct(share)}`;
  const shortOwn=key==='ball'?'Robos':'Propio',shortOpp=key==='ball'?'Pérdidas':'Rival';
  const values=compareMode?`<div class="comparison-value"><strong>${signed(balance).replace(',0','')}</strong><span>${key==='ball'?'Robos − pérdidas':'Propio − rival'}</span></div>`:`<div class="stat-values"><strong>${num(own,totalMode?0:1)}</strong><strong>${num(opp,totalMode?0:1)}</strong></div><div class="value-caption"><span>${shortOwn}</span><span>${shortOpp}</span></div>`;
  const mini=rows.length===1||totalMode?pairedBarsVisual(key,rows):compareMode?balanceVisual(key,rows):dualTrendSVG(rows,key,true);
  const visual=`<div class="metric-evolution">${mini}</div>`;
  return `<button class="stat-card live-stat-card ${compareMode?'comparison-card':''}" data-detail="live:${key}"><header><span>${metric.label}</span><small>Directo</small></header>${values}${visual}<footer><span>${insight}</span><b>Ver detalle →</b></footer></button>`;
}

function quarterStats() {
  const games = quarterGames();
  if (!games.length) return null;
  const maxQ = Math.max(4, ...games.flatMap(g => (g.quarters || []).map(q => q.quarter)));
  const periods = [];
  for (let q = 1; q <= maxQ; q++) {
    const entries = games.map(g => {
      const row = (g.quarters || []).find(item => item.quarter === q);
      return row ? {game:g, us:row.us, them:row.them, diff:row.us - row.them} : null;
    }).filter(Boolean);
    if (!entries.length && q > 4) continue;
    const n = entries.length;
    const usTotal = sum(entries, e => e.us), themTotal = sum(entries, e => e.them), diffTotal = usTotal - themTotal;
    const won = entries.filter(e => e.diff > 0).length, tied = entries.filter(e => e.diff === 0).length, lost = entries.filter(e => e.diff < 0).length;
    const sorted = [...entries].sort((a, b) => b.diff - a.diff);
    periods.push({
      quarter:q, label:quarterLabel(q), short:quarterShort(q), gamesCount:n,
      usTotal, themTotal, diffTotal,
      usAvg:n ? usTotal / n : null, themAvg:n ? themTotal / n : null, diffAvg:n ? diffTotal / n : null,
      won, tied, lost, winPct:n ? won / n * 100 : null,
      bestDiff:sorted[0] || null, worstDiff:sorted.at(-1) || null
    });
  }
  const regular = periods.filter(p => p.quarter <= 4 && p.gamesCount > 0);
  const fullRegGames = games.filter(g => [1,2,3,4].every(q => (g.quarters || []).some(item => item.quarter === q)));
  const halfCalc = qs => {
    if (!fullRegGames.length) return {gamesCount:0, usTotal:0, themTotal:0, diffTotal:0, usAvg:null, themAvg:null, diffAvg:null};
    const rows = fullRegGames.map(g => {
      const items = (g.quarters || []).filter(item => qs.includes(item.quarter));
      const us = sum(items, x => x.us), them = sum(items, x => x.them);
      return {game:g, us, them, diff:us - them};
    });
    const usTotal = sum(rows, r => r.us), themTotal = sum(rows, r => r.them);
    return {gamesCount:rows.length, usTotal, themTotal, diffTotal:usTotal - themTotal, usAvg:usTotal / rows.length, themAvg:themTotal / rows.length, diffAvg:(usTotal - themTotal) / rows.length};
  };
  const firstHalf = halfCalc([1, 2]), secondHalf = halfCalc([3, 4]);
  const totalWon = sum(regular, p => p.won), totalTied = sum(regular, p => p.tied), totalLost = sum(regular, p => p.lost), totalPlayed = totalWon + totalTied + totalLost;
  const bestQuarter = [...regular].sort((a, b) => (b.diffAvg ?? -Infinity) - (a.diffAvg ?? -Infinity))[0] || null;
  const worstQuarter = [...regular].sort((a, b) => (a.diffAvg ?? Infinity) - (b.diffAvg ?? Infinity))[0] || null;
  const bestOffenseQuarter = [...regular].sort((a, b) => (b.usAvg ?? -Infinity) - (a.usAvg ?? -Infinity))[0] || null;
  const bestDefenseQuarter = [...regular].sort((a, b) => (a.themAvg ?? Infinity) - (b.themAvg ?? Infinity))[0] || null;
  const corr = pred => {
    const subset = fullRegGames.filter(pred);
    return {played:subset.length, wins:subset.filter(g => +g.us > +g.them).length, losses:subset.filter(g => +g.us < +g.them).length};
  };
  const qVal = (g, q) => (g.quarters || []).find(item => item.quarter === q);
  const correlations = {
    winQ1: corr(g => { const x = qVal(g, 1); return x && x.us > x.them; }),
    tieQ1: corr(g => { const x = qVal(g, 1); return x && x.us === x.them; }),
    loseQ1: corr(g => { const x = qVal(g, 1); return x && x.us < x.them; }),
    leadHalf: corr(g => { const x1 = qVal(g, 1), x2 = qVal(g, 2); return x1 && x2 && (x1.us + x2.us) > (x1.them + x2.them); }),
    tieHalf: corr(g => { const x1 = qVal(g, 1), x2 = qVal(g, 2); return x1 && x2 && (x1.us + x2.us) === (x1.them + x2.them); }),
    trailHalf: corr(g => { const x1 = qVal(g, 1), x2 = qVal(g, 2); return x1 && x2 && (x1.us + x2.us) < (x1.them + x2.them); })
  };
  return {games, periods, regular, fullRegGames, firstHalf, secondHalf, totalWon, totalTied, totalLost, totalPlayed, bestQuarter, worstQuarter, bestOffenseQuarter, bestDefenseQuarter, correlations};
}

function quarterCardsHTML(qStats) {
  if (!qStats || !qStats.regular.length) return '';
  const totalMode = statsMode === 'total', digits = totalMode ? 0 : 1;
  const regs = qStats.regular;
  const val = (p, side) => totalMode ? p[side === 'us' ? 'usTotal' : side === 'them' ? 'themTotal' : 'diffTotal'] : p[side === 'us' ? 'usAvg' : side === 'them' ? 'themAvg' : 'diffAvg'];
  const miniBars = (side, tone, peakQuarter) => {
    const max = Math.max(1, ...regs.map(p => val(p, side) || 0));
    return `<div class="quarter-bars-mini">${regs.map(p => {const v = val(p, side) || 0, h = Math.max(8, v / max * 100), isPeak = peakQuarter && p.quarter === peakQuarter.quarter; return `<span class="qb-col ${isPeak ? 'peak' : ''}"><b class="qb-val">${num(v, digits)}</b><span class="qb-track"><i class="${tone}" style="height:${h}%"></i></span><small>${p.label}</small></span>`;}).join('')}</div>`;
  };
  const ownSum = sum(regs, p => val(p, 'us') || 0), oppSum = sum(regs, p => val(p, 'them') || 0);
  const diffSum = sum(regs, p => val(p, 'diff') || 0);
  const ownPerQ = regs.length ? ownSum / regs.length : 0, oppPerQ = regs.length ? oppSum / regs.length : 0, diffPerQ = regs.length ? diffSum / regs.length : 0;
  const bestOff = qStats.bestOffenseQuarter, bestDef = qStats.bestDefenseQuarter;
  const offFooter = bestOff ? `Mejor ${bestOff.label} (${num(val(bestOff, 'us'), digits)})` : '';
  const defFooter = bestDef ? `Mejor ${bestDef.label} (${num(val(bestDef, 'them'), digits)})` : '';
  const maxAbsDiff = Math.max(1, ...regs.map(p => Math.abs(val(p, 'diff') || 0)));
  const divBars = `<div class="quarter-div-wrap"><div class="balance-mini diverging">${regs.map(p => {const d = val(p, 'diff') || 0, h = Math.max(4, Math.abs(d) / maxAbsDiff * 50); return `<span class="div-col" title="${p.label}: ${signed(d).replace(',0', '')}"><i class="${d >= 0 ? 'positive up' : 'negative down'}" style="height:${h}%"></i></span>`;}).join('')}</div><div class="quarter-div-labels">${regs.map(p => {const d = val(p, 'diff') || 0; return `<span><b>${p.label}</b><small class="${d > 0 ? 'positive' : d < 0 ? 'negative' : ''}">${signed(d).replace(',0', '')}</small></span>`;}).join('')}</div></div>`;
  const h1 = qStats.firstHalf.gamesCount ? (totalMode ? qStats.firstHalf.diffTotal : qStats.firstHalf.diffAvg) : null;
  const h2 = qStats.secondHalf.gamesCount ? (totalMode ? qStats.secondHalf.diffTotal : qStats.secondHalf.diffAvg) : null;
  const marginFooter = (h1 !== null && h2 !== null) ? `1ª ${signed(h1).replace(',0', '')} · 2ª ${signed(h2).replace(',0', '')}` : '';
  const offHeaderVal = num(totalMode ? ownSum : ownPerQ, digits);
  const defHeaderVal = num(totalMode ? oppSum : oppPerQ, digits);
  const subCap = totalMode ? 'total en cuartos' : 'media / cuarto';
  const diffMain = signed(totalMode ? diffSum : diffPerQ).replace(',0', '');
  const diffCap = `${totalMode ? 'total' : 'media / cuarto'} · ${qStats.totalWon}G–${qStats.totalLost}P${qStats.totalTied ? `–${qStats.totalTied}E` : ''}`;
  return `
    <button class="stat-card quarter-stat-card" data-detail="quarters:offense"><header><span>Puntos por cuarto</span><small>${esc(teamLabel())}</small></header><div class="stat-values own-only"><strong>${offHeaderVal}</strong></div><div class="value-caption single"><span>${subCap}</span></div><div class="metric-evolution">${miniBars('us', 'own', bestOff)}</div><footer>${offFooter?`<span>${offFooter}</span>`:''}<b>Ver detalle →</b></footer></button>
    <button class="stat-card quarter-stat-card" data-detail="quarters:defense"><header><span>Permitidos por cuarto</span><small>Rival</small></header><div class="stat-values own-only opp-value"><strong>${defHeaderVal}</strong></div><div class="value-caption single"><span>${subCap}</span></div><div class="metric-evolution">${miniBars('them', 'opp', bestDef)}</div><footer>${defFooter?`<span>${defFooter}</span>`:''}<b>Ver detalle →</b></footer></button>
    <button class="stat-card quarter-stat-card single-value-card" data-detail="quarters:margin"><header><span>Parcial por cuarto</span><small>${esc(teamLabel())} − Rival</small></header><div class="comparison-value"><strong>${diffMain}</strong></div><div class="value-caption single"><span>${diffCap}</span></div><div class="metric-evolution visual-balance">${divBars}</div><footer>${marginFooter?`<span>${marginFooter}</span>`:''}<b>Ver detalle →</b></footer></button>`;
}

function renderTeam() {
  const stats = teamStats();
  if (!stats.played) return head('team-page','Equipo',`<button class="btn primary" data-action="import-games">Importar actas</button>`) + reimportBanner() + `<div class="empty card"><div class="empty-icon">▦</div><h2>Sin partidos</h2><button class="btn primary" data-action="import-games">Elegir Excel</button></div></section>`;
  const ownTotals=stats.own.reduce((out,row)=>{['p2m','p3m','ftm','fta','fouls','val'].forEach(key=>out[key]=(out[key]||0)+(+row[key]||0));return out;},{});
  const oppTotals=stats.opp.reduce((out,row)=>{['p2m','p3m','ftm','fta','fouls','val'].forEach(key=>out[key]=(out[key]||0)+(+row[key]||0));return out;},{});
  const current=currentStreak(stats.games), currentWins=current.startsWith('V');
  const liveCards=recordedLiveGames().length?liveMetricCard('ball')+liveMetricCard('orb')+liveMetricCard('possession'):'';
  const qStats=quarterStats(), quarterCards=qStats?quarterCardsHTML(qStats):'';
  return head('team-page','Equipo',`<button class="btn" data-action="import-games">Importar acta</button>`,`${stats.played} partidos · ${state.team.season}`) + reimportBanner() + `
    <div class="summary-grid">
      <article class="score-summary card"><div><span>Balance</span><strong>${stats.wins}–${stats.losses}</strong><em>${pct(stats.wins/stats.played*100)}</em></div><div><span>Anota</span><strong>${num(stats.ppg)}</strong><em>por partido</em></div><div><span>Recibe</span><strong>${num(stats.papg)}</strong><em>por partido</em></div><div><span>Racha</span><strong>${current}</strong><em>${currentWins?'victorias':'derrotas'} seguidas</em></div></article>
      <article class="card score-evolution"><div class="card-title"><div><h2>Marcador</h2><span>Puntos y diferencia en cada partido</span></div><small>Toca un punto</small></div>${scoreChart(stats.games)}</article>
    </div>
    <div class="section-title"><div><h2>Cómo anota el equipo</h2><p>Datos publicados por la FBM; sin porcentajes de campo.</p></div></div>
    <div class="analysis-grid feature-grid">
      <button class="card visual-card mix-card" data-detail="scoring-mix"><div class="card-title"><div><h3>Origen de los puntos</h3><span>2P · 3P · TL</span></div><small>${esc(teamLabel())} / Rival</small></div>${scoringMixCompare(ownTotals,oppTotals)}</button>
      <article class="card visual-card point-share"><div class="card-title"><div><h3>Reparto de puntos</h3><span>Contribución de ${genderTerms().plural.toLowerCase()}</span></div><small>Vista rápida</small></div>${pointShareChart(stats.playerTotals,stats.ownPts)}<button class="text-link" data-detail="point-share">Ver ${genderTerms().plural.toLowerCase()}: ${playerAgg().length} →</button></article>
      ${renderMinutesCard(stats)}
    </div>
    <div class="section-title stats-title"><div><h2>Todas las estadísticas</h2><p>Elige por partido, totales o comparación. Toca una tarjeta para ver ratios, evolución y desglose.</p></div><div class="segmented" aria-label="Escala de las estadísticas"><button data-action="stats-mode" data-mode="average" class="${statsMode==='average'?'active':''}">Por partido</button><button data-action="stats-mode" data-mode="total" class="${statsMode==='total'?'active':''}">Totales</button><button data-action="stats-mode" data-mode="compare" class="${statsMode==='compare'?'active':''}">Comparar</button></div></div>
    <div class="stats-grid">${availableTeamMetricKeys().map(teamMetricCard).join('')}${liveCards}${quarterCards}</div>
    <div class="section-title"><div><h2>Mapas</h2><p>Solo partidos con mapa importado o editado.</p></div></div>
    <div class="analysis-grid maps-grid">
      <button class="card visual-card map-card" data-detail="heat-attack"><div class="card-title"><div><h3>Ataque</h3><span>${stats.shotsFor.length?`${stats.shotsFor.length} canastas · ${validGames().filter(g=>(g.shotsFor||[]).length).length} partidos con mapa`:'Sin mapa'}</span></div></div>${stats.shotsFor.length?courtHTML(stats.shotsFor,[],true)+zoneBars(stats.shotsFor,'attack'):'<div class="empty-chart">Sin mapas de ataque todavía. Añádelos desde Partidos.</div>'}</button>
      <button class="card visual-card map-card" data-detail="heat-defense"><div class="card-title"><div><h3>Defensa</h3><span>${stats.shotsAgainst.length?`${stats.shotsAgainst.length} canastas · ${validGames().filter(g=>(g.shotsAgainst||[]).length).length} partidos con mapa`:'Sin mapa'}</span></div></div>${stats.shotsAgainst.length?courtHTML([],stats.shotsAgainst,true)+zoneBars(stats.shotsAgainst,'defense'):'<div class="empty-chart">Sin mapas de defensa todavía.</div>'}</button>
    </div>
  </section>`;
}

function currentStreak(games) {
  let kind = '', n = 0;
  for (const g of chronological(games).reverse()) {
    const next = g.us > g.them ? 'V' : 'D'; if (!kind) kind = next; if (next !== kind) break; n++;
  }
  return n ? `${kind}${n}` : '—';
}

/* ── Main views ─────────────────────────────────────────────────── */
function renderPlayers() {
  const players = playerAgg();
  if (!players.length) return head('players-page', genderTerms().plural, `<button class="btn primary" data-action="import-roster">Importar plantilla</button>`) + `<div class="empty card"><h2>Sin ${genderTerms().plural.toLowerCase()}</h2></div></section>`;
  const value=(p,key)=>p.gp ? (+p[key]||0)/p.gp : -Infinity;
  players.sort((a,b)=>(value(a,playerSort)-value(b,playerSort))*playerSortDir || namePretty(a.name).localeCompare(namePretty(b.name),'es'));
  const sortHead=(key,label)=>`<button data-action="sort-players" data-key="${key}" aria-sort="${playerSort===key?(playerSortDir===-1?'descending':'ascending'):'none'}">${label}${playerSort===key?(playerSortDir===-1?' ↓':' ↑'):''}</button>`;
  return head('players-page', genderTerms().plural, `<button class="btn" data-action="manage-roster">Gestionar plantilla</button><button class="btn" data-action="import-roster">Actualizar plantilla</button>`, `${players.length} ${genderTerms().plural.toLowerCase()}`) + reimportBanner() + `<div class="player-table-head"><span></span><span>${genderTerms().singular}</span><span></span>${sortHead('pts','PTS/P')}${sortHead('min','MIN/P')}${sortHead('val','VAL/P')}<span></span></div><div class="player-ranking">${players.map(p => {
    const points = p.games.map(x => x.p.pts), ppg = p.gp ? p.pts / p.gp : null;
    return `<button class="player-rank" data-detail="player:${encodeURIComponent(norm(p.name))}"><span class="player-number">${esc(p.number || '—')}</span><span class="player-id"><b>${esc(namePretty(p.name))}</b><small>${p.gp ? `${p.gp} partidos` : 'Sin acta'}</small></span><span class="player-spark">${sparkline(points, 'player', 100, 30)}</span><span class="rank-metric" title="Puntos por partido"><b>${p.gp ? num(ppg) : '—'}</b><small>PTS/P</small></span><span class="rank-metric" title="Minutos por partido"><b>${p.gp ? num(p.min / p.gp) : '—'}</b><small>MIN/P</small></span><span class="rank-metric" title="Valoración por partido"><b>${p.gp ? num(p.val / p.gp) : '—'}</b><small>VAL/P</small></span><span class="rank-arrow">›</span></button>`;
  }).join('')}</div></section>`;
}

function renderGames() {
  const games = [...state.games].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const played=validGames().length,pending=games.length-played,meta=`${played} partido${played===1?'':'s'}${pending?` · ${pending} pendiente${pending===1?'':'s'}`:''}`;
  return head('games-page', 'Partidos', `<button class="btn" data-action="import-games">Importar acta</button><button class="btn primary" data-action="open-shot">Añadir mapa</button>`, meta) + reimportBanner() + (!games.length ? `<div class="empty card"><h2>Sin partidos</h2><button class="btn primary" data-action="import-games">Elegir Excel</button></div>` : `<div class="games-list">${games.map(g => {
    const complete = !g.needsReimport && g.opponentPlayers?.length;
    const isPending=!hasScore(g.us)||!hasScore(g.them)||g.source==='live-pending',result=isPending?'pending':g.us>g.them?'win':'loss';
    const score=gameScore(g).split('–');
    return `<button class="game-row" data-detail="game:${g.id}"><span class="game-result ${result}">${isPending?'P':g.us > g.them ? 'V' : 'D'}</span><span class="game-main"><b>${esc(g.opponent)}</b><small>${fmtDate(g.date)} · ${isPending?'Pendiente de acta':g.home ? 'Casa' : 'Fuera'}</small></span><span class="game-score" title="Local–visitante">${score[0]}<i>–</i>${score[1]}</span><span class="game-data"><i class="${complete ? 'ok' : 'warn'}"></i>${isPending?'Directo guardado':complete ? `${g.players.length} + ${g.opponentPlayers.length}` : 'Reimportar'}</span><span class="rank-arrow">›</span></button>`;
  }).join('')}</div>`) + `</section>`;
}

function ensureDraftSelection() {
  const ids = new Set(state.roster.map(p => p.id));
  state.liveDraft.selected = state.liveDraft.selected.filter(id => ids.has(id));
  if (!state.liveDraft.selected.length && state.roster.length) state.liveDraft.selected = state.roster.map(p => p.id);
}

function renderLive() {
  const L = state.live;
  if (!L) {
    ensureDraftSelection(); const d = state.liveDraft;
    return head('live-page', 'Directo', '', '') + `<div class="card live-setup"><div class="setup-fields"><label class="field">Rival<input id="rival" value="${esc(d.rival)}" placeholder="Nombre del rival" autocomplete="off"></label><label class="field">Fecha<input id="liveDate" type="date" value="${esc(d.date || today())}"></label></div><div class="roster-heading"><b>Convocadas</b><span id="selectedCount">${d.selected.length} convocad${state.team.gender==='female'?'as':'os'}</span></div>${state.roster.length ? `<div class="roster-grid">${state.roster.map(p => { const checked = d.selected.includes(p.id); return `<label class="roster-card ${checked ? 'selected' : ''}"><input type="checkbox" value="${p.id}" ${checked ? 'checked' : ''}><span class="check">${checked ? '✓' : ''}</span><strong>${esc(p.number || '—')}</strong><span class="roster-name">${esc(shortName(p.name))}</span></label>`; }).join('')}</div>` : `<div class="empty-inline">Importa la plantilla.</div>`}<div class="sticky-start"><button class="btn direct" data-action="start-live" ${state.settings.role === 'viewer' || !state.roster.length ? 'disabled' : ''}>Empezar</button><button class="btn" data-action="import-roster">Importar plantilla</button></div></div></section>`;
  }
  const count = type => L.events.filter(e => e.type === type && !e.undone).length;
  return `<section class="live-page"><div class="live-board"><div class="live-meta"><div><h1>${esc(L.opponent)}</h1><p>${L.players.length} convocad${state.team.gender==='female'?'as':'os'} · ${fmtDate(L.date)}</p></div><span class="quarter-badge">Q${L.quarter}</span></div><div class="quarter" aria-label="Cuarto">${[1,2,3,4].map(q => `<button class="${q === L.quarter ? 'active' : ''}" data-action="quarter" data-q="${q}">${q}º</button>`).join('')}</div><div class="live-actions">${liveButton('steal','↗','Robo',count('steal'))}${liveButton('turnover','↘','Pérdida',count('turnover'))}${liveButton('orbFor','◎','Rebote ofensivo',count('orbFor'))}${liveButton('orbAgainst','◌','Rebote rival',count('orbAgainst'))}</div><div class="live-footer"><button class="btn" data-action="undo-live" ${L.events.some(e => !e.undone) ? '' : 'disabled'}>Deshacer</button><button class="btn danger" data-action="discard-live">Descartar</button><button class="btn direct" data-action="finish-live">Finalizar</button></div></div></section>`;
}

function liveButton(type, symbol, label, count) { return `<button class="live-action" data-action="add-live" data-type="${type}"><span class="symbol">${symbol}</span><b>${label}</b><strong>${count}</strong></button>`; }

function render() {
  applyTeamIdentity();$$('.team-players-label').forEach(node=>node.textContent=genderTerms().plural);
  $('#roleLabel').textContent = (state.settings.role || 'admin').toUpperCase();
  const teamButton=$('#teamButton');if(teamButton){teamButton.querySelector('b').textContent=teamLabel();teamButton.querySelector('small').textContent=state.team.season||'Sin temporada';}
  const brandMeta=$('.brand small');if(brandMeta)brandMeta.textContent=`${teamLabel()}${state.team.season?` · ${state.team.season}`:''}`;
  $('#view').innerHTML = view === 'team' ? renderTeam() : view === 'players' ? renderPlayers() : view === 'games' ? renderGames() : renderLive();
  document.body.dataset.view = view; document.body.dataset.role = state.settings.role || 'admin';
  document.body.classList.toggle('live-running', view === 'live' && !!state.live);
  applyTheme(document.documentElement.dataset.theme || 'light');
}

function openModal(kicker, titleText, body) {
  if($('#modal').hidden) modalReturnFocus=document.activeElement;
  $('#modalKicker').textContent = kicker; $('#modalTitle').textContent = titleText; $('#modalBody').innerHTML = body;
  const modal = $('#modal'); modal.hidden = false; modal.setAttribute('aria-hidden', 'false'); $('.app-shell')?.setAttribute('inert',''); setTimeout(() => $('.modal-sheet .icon-button')?.focus(), 0);
}
function closeModal() { $('.app-shell')?.removeAttribute('inert'); const modal = $('#modal'); modal.hidden = true; modal.setAttribute('aria-hidden', 'true'); modalContext = null; const target=modalReturnFocus;modalReturnFocus=null;if(target?.isConnected)setTimeout(()=>target.focus(),0); }

const PLAYER_METRICS = {
  pts:{label:'Puntos', value:player=>player.pts, team:game=>mean(game.players||[],player=>player.pts)},
  min:{label:'Minutos', value:player=>player.min, team:game=>mean(game.players||[],player=>player.min)},
  p2m:{label:'Canastas de 2', value:player=>player.p2m, team:game=>mean(game.players||[],player=>player.p2m)},
  p3m:{label:'Canastas de 3', value:player=>player.p3m, team:game=>mean(game.players||[],player=>player.p3m)},
  ftm:{label:'Tiros libres', value:player=>player.ftm, team:game=>mean(game.players||[],player=>player.ftm)},
  ftp:{label:'Porcentaje TL', value:player=>player.fta ? player.ftm/player.fta*100 : null, team:game=>{const total=effectiveTotals(game,'own');return total.fta?total.ftm/total.fta*100:null;}},
  fouls:{label:'Faltas por partido', value:player=>player.fouls, team:game=>mean(game.players||[],player=>player.fouls)},
  val:{label:'Valoración por partido', value:player=>player.val, team:game=>mean(game.players||[],player=>player.val)},
  pm:{label:'+/-', value:player=>player.pm, team:game=>mean(game.players||[],player=>player.pm)},
  liveSteals:{label:'Robos · Directo', live:true, value:(player,game)=>hasManualData(game)&&wasRecordedInLive(game,player)?eventCounts(game,player).steals:null, team:game=>hasManualData(game)?mean(game.players||[],player=>eventCounts(game,player).steals):null},
  liveTurnovers:{label:'Pérdidas · Directo', live:true, value:(player,game)=>hasManualData(game)&&wasRecordedInLive(game,player)?eventCounts(game,player).turnovers:null, team:game=>hasManualData(game)?mean(game.players||[],player=>eventCounts(game,player).turnovers):null},
  liveOrb:{label:'REB O · Directo', live:true, value:(player,game)=>hasManualData(game)&&wasRecordedInLive(game,player)?eventCounts(game,player).orb:null, team:game=>hasManualData(game)?mean(game.players||[],player=>eventCounts(game,player).orb):null}
};

function wasRecordedInLive(game,player) {
  const ids=game?.livePlayerIds||[];if(!ids.length)return true;
  const names=new Set(state.roster.filter(r=>ids.includes(r.id)).map(r=>norm(r.name)));
  return names.has(norm(player?.name))||(game.events||[]).some(e=>!e.undone&&resolveEventPlayer(game,e)===player);
}
function availablePlayerMetrics() {
  return Object.entries(PLAYER_METRICS);
}

function playerMetricRows(player,key) {
  const metric=PLAYER_METRICS[key]||PLAYER_METRICS.pts;
  return [...player.games].sort((a,b)=>gameTime(a.g).localeCompare(gameTime(b.g))).map(({g,p})=>({g,value:metric.value(p,g),team:metric.team(g)}));
}

function playerSeasonReference(key) {
  const metric=PLAYER_METRICS[key]||PLAYER_METRICS.pts;
  const games=validGames();
  if (key==='ftp') {
    const made=sum(games,game=>effectiveTotals(game,'own').ftm), attempted=sum(games,game=>effectiveTotals(game,'own').fta);
    return attempted?made/attempted*100:null;
  }
  const values=games.map(game=>metric.team(game)).filter(value=>value!==null&&Number.isFinite(+value));
  return values.length?mean(values,value=>value):null;
}

function playerTrendSVG(player,key) {
  const metric=PLAYER_METRICS[key]||PLAYER_METRICS.pts, rows=playerMetricRows(player,key), season=playerSeasonReference(key);
  if (!rows.length) return `<div class="empty-chart">Sin partidos</div>`;
  const valid=rows.flatMap(row=>[row.value,row.team,season]).filter(value=>value!==null&&Number.isFinite(+value));
  const min=Math.min(0,...valid), max=Math.max(1,...valid), w=Math.max(780,rows.length*78),h=285;
  const x=index=>rows.length===1?w/2:46+index*(w-92)/(rows.length-1), y=value=>h-46-(value-min)/(max-min||1)*(h-88);
  const missingText=key==='ftp'?'sin tiros':'sin datos';
  const buildSegments=field=>{const out=[];let current=[];rows.forEach((row,index)=>{const value=row[field];if(value===null||!Number.isFinite(+value)){if(current.length)out.push(current);current=[];}else current.push(`${x(index)},${y(value)}`)});if(current.length)out.push(current);return out;};
  return `<div class="trend-scroller"><svg class="player-trend" viewBox="0 0 ${w} ${h}" style="min-width:${Math.max(0,rows.length*72)}px" role="img" aria-label="Evolución de ${esc(metric.label)}">
    <line class="trend-grid zero-line" x1="28" y1="${y(0)}" x2="${w-28}" y2="${y(0)}"/><text class="axis-label" x="31" y="${Math.max(12,y(max)-5)}">máx ${metricValue(key,max)}</text><text class="axis-label" x="31" y="${Math.min(h-50,y(min)+14)}">mín ${metricValue(key,min)}</text><text class="axis-label zero-label" x="${w-31}" y="${Math.max(12,y(0)-5)}" text-anchor="end">0</text>
    <line class="trend-axis" x1="28" y1="${h-46}" x2="${w-28}" y2="${h-46}"/>
    ${season===null?'':`<line class="team-season" x1="34" y1="${y(season)}" x2="${w-34}" y2="${y(season)}"/><text class="season-label" x="${w-36}" y="${Math.max(14,y(season)-7)}" text-anchor="end">Temporada ${metricValue(key,season)}</text>`}
    ${buildSegments('team').map(points=>`<polyline class="team-average" points="${points.join(' ')}"/>`).join('')}
    ${buildSegments('value').map(points=>`<polyline class="player-line" points="${points.join(' ')}"/>`).join('')}
    ${rows.map((row,index)=>`<g data-action="trend-game" data-id="${row.g.id}" tabindex="0" role="button">
      ${row.value===null?`<circle class="missing" cx="${x(index)}" cy="${h-46}" r="7"/><text class="missing-label" x="${x(index)}" y="${h-57}" text-anchor="middle">${missingText}</text>`:`<circle cx="${x(index)}" cy="${y(row.value)}" r="8"/><text x="${x(index)}" y="${Math.max(15,y(row.value)-14)}" text-anchor="middle">${metricValue(key,row.value)}</text>`}
      <text class="game-index" x="${x(index)}" y="${h-18}" text-anchor="middle">P${index+1}</text><title>${esc(row.g.opponent)} · ${metric.label} ${row.value===null?missingText:metricValue(key,row.value)}</title>
    </g>`).join('')}
  </svg></div><div class="trend-legend"><span class="player">${genderTerms().singular}</span><span class="average">Media de la plantilla · partido</span><span class="season">Equipo · temporada</span></div>`;
}

const teamMinutes = game => { const m = +effectiveTotals(game,'own').min; return m >= 150 ? m : 200; };
function playerShareData(player, mode='average') {
  const playerGames=player.games.map(item=>item.g).filter(game=>hasScore(game.us));
  const teamPoints=sum(playerGames,game=>game.us);
  if(mode==='season') return {points:sum(validGames(),game=>game.us)?player.pts/sum(validGames(),game=>game.us)*100:0, minutes:validGames().length?player.min/sum(validGames(),teamMinutes)*100:0, label:'temporada'};
  const teamPpg=playerGames.length?teamPoints/playerGames.length:0;
  return {points:player.gp&&teamPpg?(player.pts/player.gp)/teamPpg*100:0,minutes:player.gp?player.min/sum(player.games.map(item=>item.g),teamMinutes)*100:0,label:'por partido'};
}
function robPerDisplay(steals,turnovers){return turnovers?num(steals/turnovers,2):steals?'∞':'—';}

function openPlayerDetail(key,metricKey='pts',shareMode='average') {
  const player=playerAgg().find(item=>norm(item.name)===key); if(!player)return;
  modalContext={type:'player',key,metric:metricKey,shareMode};
  const metric=PLAYER_METRICS[metricKey]||PLAYER_METRICS.pts;
  const eligible=player.games.filter(({g,p})=>metric.value(p,g)!==null);
  const best=eligible.length?[...eligible].sort((a,b)=>(metric.value(b.p,b.g)||0)-(metric.value(a.p,a.g)||0))[0]:null;
  const averages=[['PTS/P',player.gp?num(player.pts/player.gp):'—'],['PTS/40',player.min?num(player.pts/player.min*40):'—'],['MIN/P',player.gp?num(player.min/player.gp):'—'],['VAL/P',player.gp?num(player.val/player.gp):'—'],['FAL/P',player.gp?num(player.fouls/player.gp):'—'],['+/- /P',player.gp?signed(player.pm/player.gp):'—'],['2P/P',player.gp?num(player.p2m/player.gp):'—'],['3P/P',player.gp?num(player.p3m/player.gp):'—'],['TL/P',player.gp?num(player.ftm/player.gp):'—'],['TL%',player.fta?pct(player.ftm/player.fta*100):'Sin tiros']];
  const balance=(player.steals||0)+(player.orbLive||0)-(player.turnovers||0);
  const liveStats=player.manualGp?[['Directos',player.manualGp],['Robos',player.steals||0],['Robos/P',num(player.steals/player.manualGp)],['Pérdidas',player.turnovers||0],['Pérdidas/P',num(player.turnovers/player.manualGp)],['Ratio robos/pérdidas',robPerDisplay(player.steals||0,player.turnovers||0)],['Balance (ROB + REB O) − pérdidas',signed(balance).replace(',0','')],['REB O',player.orbLive||0],['REB O/P',num(player.orbLive/player.manualGp)]]:[];
  const allStats=[...averages,...liveStats],share=playerShareData(player,shareMode);
  const options=availablePlayerMetrics().map(([metricId,item])=>`<option value="${metricId}" ${metricId===metricKey?'selected':''}>${item.label}</option>`).join('');
  const directNote=player.manualGp?`<p class="inline-data-note ${balance<0?'negative':''}"><b>Directo integrado · ${player.manualGp} partido${player.manualGp===1?'':'s'}</b><span>El ratio robos/pérdidas nunca es negativo. El balance suma robos y rebotes ofensivos y resta pérdidas; si no hay pérdidas, el ratio muestra ∞ o —.</span></p>`:'';
  openModal(genderTerms().singular,namePretty(player.name),`<div class="player-summary"><div class="player-number large">${esc(player.number||'—')}</div><div><b>${player.gp} partidos</b><span>${best?`Mejor ${metric.label}: ${esc(best.g.opponent)}`:'Sin dato válido'}</span></div></div><div class="player-overview"><div class="detail-stats unified-player-stats">${allStats.map(([label,value])=>`<div class="${label.startsWith('Balance')&&balance<0?'negative-value':''}"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><div><div class="segmented share-mode" aria-label="Escala de las cuotas"><button data-action="player-share" data-mode="average" class="${shareMode==='average'?'active':''}">Por partido</button><button data-action="player-share" data-mode="season" class="${shareMode==='season'?'active':''}">Temporada</button></div><div class="share-donuts">${donut(share.points,`Cuota puntos · ${share.label}`,'player')}${donut(share.minutes,`Cuota minutos · ${share.label}`,'game')}</div></div></div>${directNote}<section class="trend-section"><div class="trend-head"><div><h3>Evolución</h3><p>Desliza si hay muchos partidos. Los huecos significan «sin datos», no cero.</p></div><select id="playerMetric">${options}</select></div><div id="playerTrend">${playerTrendSVG(player,metricKey)}</div></section><section><h3>Partidos</h3><div class="player-games">${chronological(player.games.map(item=>item.g)).map(g=>{const p=player.games.find(item=>item.g.id===g.id)?.p;return `<button data-detail="game:${g.id}"><span><b>${esc(g.opponent)}</b><small>${fmtDate(g.date)} · ${formatMinutes(p?.min)}</small></span><strong>${p?.pts||0} PTS</strong><em>${signed(p?.pm||0)}</em></button>`}).join('')}</div></section>`);
}

/* ── Match report and shot maps ─────────────────────────────────── */
const BOX_GROUPS = [
  {label:'', cols:[['min','MIN'],['pts','PTS']]},
  {label:'TIRO', cols:[['p2ai','2P'],['p3ai','3P'],['ftai','TL']]},
  {label:'REBOTE', optional:true, cols:[['rebDef','DEF'],['rebOff','OF'],['rebTot','TOT']]},
  {label:'JUEGO', optional:true, cols:[['ast','AST'],['rec','REC'],['per','PER'],['tapTc','TAP'],['tapTr','TAP R']]},
  {label:'', cols:[['fouls','FAL'],['foulsDrawn','FR'],['val','VAL'],['pm','+/-']]},
  {label:'DIRECTO', live:true, cols:[['liveSteals','ROB'],['liveTurnovers','PER'],['liveOrb','REB O'],['liveRivalOrb','REB R']]}
];

function visibleBoxGroups(rows, total, own) {
  return BOX_GROUPS.map(group => ({...group, cols:group.cols.filter(([k]) => {
    if (group.live && !own) return false;
    if (group.live) return true;
    if (k === 'foulsDrawn' && !rows.some(r => +r[k])) return false;
    if (!group.optional && !group.live) return true;
    return rows.some(r => +r[k]) || +total[k];
  })})).filter(g => g.cols.length);
}

function formatBox(r, key) {
  if (key === 'min') return r.minRaw || formatMinutes(r.min);
  if (['p2ai','p3ai','ftai'].includes(key)) return esc(r[key] || '0/0');
  if (key === 'pm') return signed(+r[key] || 0).replace(',0','');
  if (key.startsWith('live')) {
    if (!r._manualAvailable || (key === 'liveRivalOrb' && !r._isTotal && !r._teamUnassigned)) return '—';
    return Number.isFinite(+r[key]) ? +r[key] : 0;
  }
  return Number.isFinite(+r[key]) ? +r[key] : '—';
}

function compareBox(a, b) {
  const ax = String(a ?? ''), bx = String(b ?? '');
  if (ax.includes('/') || bx.includes('/')) return parseAI(ax).m - parseAI(bx).m;
  const an = parseFloat(ax), bn = parseFloat(bx); return Number.isFinite(an) && Number.isFinite(bn) ? an - bn : ax.localeCompare(bx, 'es', {numeric:true});
}

function openGameDetail(gameId) {
  const g = state.games.find(x => x.id === gameId); if (!g) return;
  modalContext = {type:'game', gameId, side:'own', sort:'number', dir:1, map:'attack'};
  openModal('Partido', g.opponent, `<div id="gameDetail"></div>`); renderGameDetail();
}

function renderGameDetail() {
  if (modalContext?.type !== 'game') return;
  const g = state.games.find(x => x.id === modalContext.gameId); if (!g) return;
  if(g.source==='live-pending'||!hasScore(g.us)||!hasScore(g.them)){
    const ec=eventCounts(g),active=(g.events||[]).filter(event=>!event.undone);
    const games=validGames(),suggested=games.map(game=>({...pendingScore(g,game,game.date),game})).filter(item=>item.name>=.35).sort((a,b)=>b.score-a.score)[0]?.game;
    $('#gameDetail').innerHTML=`<div class="pending-hero"><span>Directo guardado · ${fmtDate(g.date)}</span><strong>Esperando acta</strong><p>Al importar el Excel del partido, la app conservará y unirá estos datos manuales.</p></div><div class="metric-summary"><div><span>Robos</span><strong>${ec.steals}</strong></div><div><span>Pérdidas</span><strong>${ec.turnovers}</strong></div><div><span>REB O propio</span><strong>${ec.orb}</strong></div><div><span>REB O rival</span><strong>${ec.rivalOrb}</strong></div></div><div class="coverage-note"><b>${active.length} evento${active.length===1?'':'s'} conservado${active.length===1?'':'s'}</b><span>No cuenta en estadísticas hasta tener marcador.</span></div>${games.length?`<div class="manual-join"><label class="field">Unir manualmente a un acta<select id="pendingTarget">${games.map(game=>`<option value="${game.id}" ${game.id===suggested?.id?'selected':''}>${esc(game.opponent)} · ${fmtDate(game.date)} · ${gameScore(game)}</option>`).join('')}</select></label><button class="btn" data-action="merge-pending-manual" data-id="${g.id}">Unir a esta acta</button></div>`:''}<button class="btn primary wide pending-import" data-action="import-games" data-pending-id="${g.id}">Importar acta y unir</button>`;
    return;
  }
  const own = modalContext.side === 'own', players = own ? (g.players || []) : (g.opponentPlayers || []);
  const manualAvailable=own&&hasManualData(g);
  const rows = players.map(p => { const ec = eventCounts(g,p); return {...p, _manualAvailable:manualAvailable, liveSteals:own ? ec.steals : 0, liveTurnovers:own ? ec.turnovers : 0, liveOrb:own ? ec.orb : 0, liveRivalOrb:null}; });
  if (manualAvailable) {
    const unassigned=unassignedEventCounts(g);
    if (unassigned.steals||unassigned.turnovers||unassigned.orb||unassigned.rivalOrb) rows.push({id:'team-unassigned',number:'',name:'Equipo / sin asignar',_manualAvailable:true,_teamUnassigned:true,liveSteals:unassigned.steals,liveTurnovers:unassigned.turnovers,liveOrb:unassigned.orb,liveRivalOrb:unassigned.rivalOrb});
  }
  const ec = eventCounts(g), rawTotal = effectiveTotals(g, own ? 'own' : 'opp');
  const total = {...rawTotal, name:'TOTALES', _isTotal:true, _manualAvailable:manualAvailable, liveSteals:own ? ec.steals : 0, liveTurnovers:own ? ec.turnovers : 0, liveOrb:own ? ec.orb : 0, liveRivalOrb:own ? ec.rivalOrb : 0};
  rows.sort((a,b) => a._teamUnassigned ? 1 : b._teamUnassigned ? -1 : compareBox(a[modalContext.sort], b[modalContext.sort]) * modalContext.dir);
  const groups = visibleBoxGroups(rows, total, own), columns = groups.flatMap(x => x.cols);
  const individualRows=rows.filter(row=>!row._teamUnassigned),unassignedRow=rows.find(row=>row._teamUnassigned);
  const directWarnings=[];
  if (own&&manualAvailable) {
    for (const key of ['liveSteals','liveTurnovers','liveOrb']) {
      const individual=sum(individualRows,row=>row[key]),unassigned=+unassignedRow?.[key]||0;
      if (individual+unassigned!==+total[key]) directWarnings.push(key);
    }
  }
  const warning = g.needsReimport || (!own && !players.length) ? `<div class="reimport-inline"><b>Faltan datos del rival</b><span>Vuelve a importar el acta. La actualización conserva Directo y mapas.</span><button class="btn" data-action="import-games">Reimportar</button></div>` : '';
  const directWarning=directWarnings.length?`<div class="data-warning"><b>Revisar Directo</b><span>Las filas individuales y el total no cuadran (${directWarnings.map(k=>({liveSteals:'ROB',liveTurnovers:'PER',liveOrb:'REB O'}[k])).join(', ')}). Puede faltar alguna ${genderTerms().singular.toLowerCase()} en el acta.</span></div>`:'';
  const manualNotice=own&&!manualAvailable?`<div class="manual-table-notice"><b>ROB · PER · REB O · REB R</b><span>Sin datos registrados todavía. Las columnas se muestran para distinguir ausencia de un cero real.</span></div>`:'';
  const quartersStrip = hasQuarterData(g) ? (() => {
    const qs = sanitiseQuarters(g.quarters);
    const q1 = qs.find(x => x.quarter === 1), q2 = qs.find(x => x.quarter === 2), q3 = qs.find(x => x.quarter === 3), q4 = qs.find(x => x.quarter === 4);
    const halves = (q1 && q2 && q3 && q4) ? (() => {
      const h1u = q1.us + q2.us, h1t = q1.them + q2.them, h1d = h1u - h1t;
      const h2u = q3.us + q4.us, h2t = q3.them + q4.them, h2d = h2u - h2t;
      return `<div class="game-halves-summary"><span><b>Descanso:</b> ${h1u}–${h1t} <em class="${h1d > 0 ? 'positive' : h1d < 0 ? 'negative' : ''}">(${h1d > 0 ? '+' : ''}${h1d})</em></span><span><b>2ª parte:</b> ${h2u}–${h2t} <em class="${h2d > 0 ? 'positive' : h2d < 0 ? 'negative' : ''}">(${h2d > 0 ? '+' : ''}${h2d})</em></span></div>`;
    })() : '';
    return `<section class="game-quarters-strip" aria-label="Parciales por cuarto"><div class="game-quarters-head"><b>Parciales (${esc(teamLabel())}–Rival)</b></div><div class="game-quarters-pills">${qs.map(item => {const d = item.us - item.them; return `<div class="game-quarter-pill ${d > 0 ? 'win' : d < 0 ? 'loss' : ''}"><span>${quarterShort(item.quarter)}</span><strong>${item.us}–${item.them}</strong><em>${d > 0 ? '+' : ''}${d}</em></div>`;}).join('')}</div>${halves}</section>`;
  })() : '';
  $('#gameDetail').innerHTML = `<div class="score-hero"><div><span>${esc(gameSides(g))} · ${fmtDate(g.date)} · local–visitante</span><strong>${gameScore(g)}</strong></div><div class="result-pill ${g.us > g.them ? 'win' : 'loss'}">${g.us > g.them ? 'Victoria' : 'Derrota'}</div></div>${quartersStrip}${warning}${directWarning}${manualNotice}<div class="team-tabs"><button class="${own ? 'active' : ''}" data-action="game-team" data-side="own">${esc(teamLabel())} · ${g.us}</button><button class="${!own ? 'active' : ''}" data-action="game-team" data-side="opp">${esc(g.opponent)} · ${g.them}</button></div><div class="box-hint">Desliza la tabla</div><div class="box-wrap"><table class="boxscore"><thead><tr><th class="identity" rowspan="2" data-action="sort-box" data-key="number">${genderTerms().number} · Nombre</th>${groups.map(group => `<th colspan="${group.cols.length}">${group.label}</th>`).join('')}</tr><tr>${groups.map(group => group.cols.map(([k,label]) => `<th data-action="sort-box" data-key="${k}">${label}${modalContext.sort === k ? (modalContext.dir === 1 ? ' ↑' : ' ↓') : ''}</th>`).join('')).join('')}</tr></thead><tbody>${rows.map(r => `<tr class="${r._teamUnassigned?'team-unassigned':''}"><td class="identity" title="${esc(namePretty(r.name))}"><b>${esc(r.number || '—')}</b><span>${esc(r._teamUnassigned?'Equipo / sin asignar':firstName(r.name))}</span></td>${columns.map(([k]) => `<td>${formatBox(r,k)}</td>`).join('')}</tr>`).join('')}<tr class="totals"><td class="identity"><b></b><span>TOTALES</span></td>${columns.map(([k]) => `<td>${formatBox(total,k)}</td>`).join('')}</tr></tbody></table></div><div class="game-map-block"><div class="map-switch"><button class="${modalContext.map === 'attack' ? 'active' : ''}" data-action="game-map" data-mode="attack">Ataque</button><button class="${modalContext.map === 'defense' ? 'active' : ''}" data-action="game-map" data-mode="defense">Defensa</button><button class="${modalContext.map === 'both' ? 'active' : ''}" data-action="game-map" data-mode="both">Juntos</button></div>${courtHTML(modalContext.map === 'defense' ? [] : g.shotsFor || [], modalContext.map === 'attack' ? [] : g.shotsAgainst || [], false)}<button class="btn" data-action="shot-for-game" data-id="${g.id}">Editar mapa</button></div>`;
}

function openScoringMixDetail() {
  const games = chronological(validGames());
  const add = (out, total) => {
    ['p2m','p3m','ftm'].forEach(key => out[key] = (out[key] || 0) + (+total[key] || 0));
    return out;
  };
  const own = games.reduce((out,game) => add(out,effectiveTotals(game,'own')),{});
  const opp = games.reduce((out,game) => add(out,effectiveTotals(game,'opp')),{});
  modalContext = {type:'scoring-mix'};
  openModal('Estadística','Origen de los puntos',`<p class="metric-explain">Reparte los puntos entre canastas de 2, triples y tiros libres. Son anotaciones, no porcentajes de tiro.</p><section class="detail-block"><div class="card-title"><div><h3>Temporada</h3><span>${esc(teamLabel())} y rival</span></div></div>${scoringMixCompare(own,opp)}</section><section class="detail-block"><h3>Partido a partido</h3><div class="mix-games">${games.map((game,index)=>`<button data-detail="game:${game.id}"><header><span>P${index+1} · ${esc(game.opponent)}</span><strong title="Local–visitante">${gameScore(game)}</strong></header>${scoringMixCompare(effectiveTotals(game,'own'),effectiveTotals(game,'opp'))}</button>`).join('')}</div></section>`);
}

function metricPlayerBreakdown(key, mode='total') {
  const metric=TEAM_METRICS[key], players=playerAgg().filter(player=>player.gp);
  if (!metric?.player || key==='ftp') return '';
  const total=player=>+player[metric.player]||0;
  const value=player=>mode==='average'?total(player)/player.gp:total(player),max=Math.max(1,...players.map(value));
  return `<section class="detail-block"><div class="card-title breakdown-title"><div><h3>${metric.label} por ${genderTerms().singular.toLowerCase()}</h3><span>${mode==='average'?'Media por partido jugado':'Total de temporada'}</span></div><div class="segmented" aria-label="Escala del reparto"><button data-action="metric-breakdown" data-mode="total" class="${mode==='total'?'active':''}">Totales</button><button data-action="metric-breakdown" data-mode="average" class="${mode==='average'?'active':''}">Por partido</button></div></div><div class="breakdown-bars">${[...players].sort((a,b)=>value(b)-value(a)).map(player=>`<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><i><b style="width:${value(player)/max*100}%"></b></i><strong>${metricValue(key,value(player),mode==='total'?0:1)}${mode==='average'?' /P':''}</strong></button>`).join('')}</div></section>`;
}

function openTeamMetricDetail(key, breakdownMode='total') {
  const metric=TEAM_METRICS[key]; if(!metric)return;
  if(key==='margin'){const rows=teamMetricRows(key),total=aggregateMetric(key,rows,'own','total'),avg=aggregateMetric(key,rows,'own'),best=[...rows].sort((a,b)=>b.own-a.own)[0],worst=[...rows].sort((a,b)=>a.own-b.own)[0];modalContext={type:'metric',key,breakdownMode};return openModal('Estadística','Diferencia',`<p class="metric-explain">Un único valor con signo: ${esc(teamLabel())} menos rival. Positivo es ventaja; negativo es desventaja.</p><div class="metric-summary"><div><span>Total acumulado</span><strong>${metricValue(key,total,0)}</strong></div><div><span>Media por partido</span><strong>${metricValue(key,avg)}</strong></div><div><span>Mayor ventaja</span><strong>${best?metricValue(key,best.own,0):'—'}</strong></div><div><span>Mayor desventaja</span><strong>${worst?metricValue(key,worst.own,0):'—'}</strong></div></div><section class="detail-block"><h3>Evolución</h3><div class="diverging-detail">${balanceVisual(key,rows)}</div></section><div class="player-games">${rows.map(row=>`<button data-detail="game:${row.game.id}"><span><b>${esc(row.game.opponent)}</b><small>${fmtDate(row.game.date)}</small></span><strong>${metricValue(key,row.own,0)}</strong><em>${gameScore(row.game)}</em></button>`).join('')}</div>`);}
  const rows=teamMetricRows(key), ownTotal=aggregateMetric(key,rows,'own','total'), oppTotal=aggregateMetric(key,rows,'opp','total'), ownAvg=aggregateMetric(key,rows,'own'), oppAvg=aggregateMetric(key,rows,'opp');
  const ownValid=rows.filter(row=>row.own!==null&&Number.isFinite(+row.own));
  const ordered=[...ownValid].sort((a,b)=>metric.lowerBetter?a.own-b.own:b.own-a.own),best=ordered[0]||null,worst=ordered.at(-1)||null;
  const percentSummary=metric.percent?`<div class="metric-summary"><div><span>Temporada · ${esc(teamLabel())}</span><strong>${metricValue(key,ownTotal,0)}</strong></div><div><span>Temporada rival</span><strong>${metricValue(key,oppTotal,0)}</strong></div><div><span>Media · ${esc(teamLabel())}</span><strong>${metricValue(key,ownAvg)}</strong></div><div><span>Media de partidos rival</span><strong>${metricValue(key,oppAvg)}</strong></div></div>`:`<div class="metric-summary"><div><span>Total · ${esc(teamLabel())}</span><strong>${metricValue(key,ownTotal,0)}</strong></div><div><span>Total rival</span><strong>${metricValue(key,oppTotal,0)}</strong></div><div><span>Media · ${esc(teamLabel())}</span><strong>${metricValue(key,ownAvg)}</strong></div><div><span>Media rival / partido</span><strong>${metricValue(key,oppAvg)}</strong></div></div>`;
  const bestLabel=metric.lowerBetter?`Mejor ${teamLabel()} · menos`:metric.higherBetter===null?`Mayor peso · ${teamLabel()}`:`Mejor · ${teamLabel()}`,worstLabel=metric.lowerBetter?`Peor ${teamLabel()} · más`:metric.higherBetter===null?`Menor peso · ${teamLabel()}`:`Menor · ${teamLabel()}`;
  const ftpExtra=key==='ftp'?`<div class="attempt-summary"><b>${esc(teamLabel())}</b><span>${sum(rows,row=>effectiveTotals(row.game,'own').ftm)}/${sum(rows,row=>effectiveTotals(row.game,'own').fta)} TL</span><b>Rival</b><span>${sum(rows,row=>effectiveTotals(row.game,'opp').ftm)}/${sum(rows,row=>effectiveTotals(row.game,'opp').fta)} TL</span></div>`:'';
  const per40=metric.per40?(()=>{const ownMinutes=sum(rows,row=>effectiveTotals(row.game,'own').min),oppMinutes=sum(rows,row=>effectiveTotals(row.game,'opp').min);return `<div class="metric-summary per40-summary"><div><span>Faltas propias / 40 min de partido</span><strong>${ownMinutes?num(ownTotal/(ownMinutes/5)*40):'—'}</strong></div><div><span>Faltas rival / 40 min de partido</span><strong>${oppMinutes?num(oppTotal/(oppMinutes/5)*40):'—'}</strong></div></div>`;})():'';
  modalContext={type:'metric',key,breakdownMode};
  openModal('Estadística',metric.label,`<p class="metric-explain">${metric.note} En el detalle, el color elegido identifica al equipo y el color de contraste al rival.</p>${percentSummary}${per40}${ftpExtra}<section class="detail-block"><div class="card-title"><div><h3>Evolución por partido</h3><span>Desliza si hay muchos partidos · toca un punto para abrir el acta</span></div></div><div class="trend-scroller">${dualTrendSVG(rows,key,false)}</div><div class="chart-legend"><span class="us">${esc(teamLabel())}</span><span class="them">Rival</span></div></section><div class="best-worst"><div><span>${esc(bestLabel)}</span><b>${best?metricValue(key,best.own):'—'}</b><small>${best?esc(best.game.opponent):''}</small></div><div><span>${esc(worstLabel)}</span><b>${worst?metricValue(key,worst.own):'—'}</b><small>${worst?esc(worst.game.opponent):''}</small></div></div>${metricPlayerBreakdown(key,breakdownMode)}<section class="detail-block"><h3>Partido a partido</h3><div class="player-games">${rows.map(row=>`<button data-detail="game:${row.game.id}"><span><b>${esc(row.game.opponent)}</b><small>${fmtDate(row.game.date)}</small></span><strong>${metricValue(key,row.own)} / ${metricValue(key,row.opp)}</strong><em title="Local–visitante">${gameScore(row.game)}</em></button>`).join('')}</div></section>`);
}

function openPointShareDetail() {
  const players=playerAgg().sort((a,b)=>(b.pts||0)-(a.pts||0)||namePretty(a.name).localeCompare(namePretty(b.name),'es'));
  const total=sum(validGames(),game=>game.us),max=Math.max(1,...players.map(player=>player.pts||0));
  modalContext={type:'point-share'};
  openModal('Puntos','Reparto completo',`<p class="metric-explain">${genderTerms().plural}: ${players.length} en la plantilla. ${genderTerms().singular} sin acta aparece con 0, no se elimina de la lista.</p><div class="breakdown-bars full-roster">${players.map(player=>`<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><i><b style="width:${(+player.pts||0)/max*100}%"></b></i><strong>${+player.pts||0} · ${pct(total?(+player.pts||0)/total*100:0)}</strong></button>`).join('')}</div>`);
}

function liveEventPlayerName(event) {
  const rosterPlayer=rosterPlayerForEvent(event);
  return rosterPlayer?.name||event.playerName||'Equipo (sin asignar)';
}

function openLiveMetricDetail(key) {
  const metric=LIVE_METRICS[key]; if(!metric)return;
  const rows=liveMetricRows(key);
  if(key==='possession'){if(!rows.length)return openModal('Directo',metric.label,noData());const total=sum(rows,row=>row.own),avg=mean(rows,row=>row.own);modalContext={type:'live-metric',key};return openModal('Directo','Posesiones extra',`<p class="metric-explain">(REB O propios + robos propios) − (REB O rival + pérdidas propias). Los partidos sin Directo son ausencia, nunca cero.</p><div class="metric-summary"><div><span>Total</span><strong>${metricValue(key,total,0)}</strong></div><div><span>Por partido con Directo</span><strong>${metricValue(key,avg)}</strong></div></div><section class="detail-block"><h3>Partido a partido</h3><div class="possession-list">${rows.map(row=>`<button data-detail="game:${row.game.id}"><span>${esc(row.game.opponent)}</span><strong class="${row.own>=0?'positive':'negative'}">${metricValue(key,row.own,0)}</strong><small>${row.own>0?'más mi equipo':row.own<0?'más el rival':'equilibradas'}</small></button>`).join('')}</div></section>`);}if(!rows.length){modalContext={type:'live-metric',key};return openModal('Directo',metric.label,`${noData()}<p class="metric-explain">Cuando registres un partido aquí aparecerán totales, medias, ratios, evolución, cuartos y desglose por ${genderTerms().singular.toLowerCase()}. Los partidos anteriores siguen fuera del denominador.</p>`);}
  const ownTotal=sum(rows,row=>row.own),oppTotal=sum(rows,row=>row.opp),ownAvg=mean(rows,row=>row.own),oppAvg=mean(rows,row=>row.opp),games=recordedLiveGames();
  const quarters=[1,2,3,4].map(quarter=>{const events=games.flatMap(game=>(game.events||[]).filter(event=>!event.undone&&(+event.quarter||1)===quarter));return {quarter,own:events.filter(event=>event.type===metric.types[0]).length,opp:events.filter(event=>event.type===metric.types[1]).length};});
  const people=new Map();
  games.flatMap(game=>(game.events||[]).filter(event=>!event.undone&&metric.types.includes(event.type)&&event.type!=='orbAgainst')).forEach(event=>{const name=liveEventPlayerName(event),current=people.get(name)||{own:0,opp:0};event.type===metric.types[0]?current.own++:current.opp++;people.set(name,current)});
  const playerRows=[...people.entries()].sort((a,b)=>(b[1].own+b[1].opp)-(a[1].own+a[1].opp));
  const relation=ratio(ownTotal,oppTotal), share=(ownTotal+oppTotal)?ownTotal/(ownTotal+oppTotal)*100:null, balance=ownTotal-oppTotal;
  const ratioCards=key==='ball'?[['Balance robos − pérdidas',signed(balance).replace(',0','')],['Ratio robos/pérdidas',relation===null?'—':num(relation,2)],['Acciones positivas',share===null?'—':pct(share)]]:[['Balance REB O',signed(balance).replace(',0','')],['Cuota REB O propio',share===null?'—':pct(share)],['Ratio propio/rival',relation===null?'—':num(relation,2)]];
  modalContext={type:'live-metric',key};
  openModal('Directo',metric.label,`<p class="metric-explain">${metric.note} Los partidos sin registro manual quedan fuera de totales, medias y ratios: un dato ausente nunca se convierte en cero.</p><div class="coverage-note"><b>${rows.length} partido${rows.length===1?'':'s'} con registro</b><span>de ${validGames().length} disputados</span></div><div class="metric-summary"><div><span>Total · ${metric.ownLabel}</span><strong>${ownTotal}</strong></div><div><span>Total · ${metric.oppLabel}</span><strong>${oppTotal}</strong></div><div><span>Media · ${metric.ownLabel}</span><strong>${num(ownAvg)}</strong></div><div><span>Media · ${metric.oppLabel}</span><strong>${num(oppAvg)}</strong></div></div><div class="ratio-grid">${ratioCards.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><section class="detail-block"><h3>Evolución por partido</h3><div class="trend-scroller">${dualTrendSVG(rows,key,false)}</div><div class="chart-legend"><span class="us">${metric.ownLabel}</span><span class="them">${metric.oppLabel}</span></div></section><section class="detail-block"><h3>Por cuarto</h3><div class="quarter-breakdown">${quarters.map(row=>compareBar(`Q${row.quarter}`,row.own,row.opp,value=>num(value,0))).join('')}</div></section><section class="detail-block"><h3>${key==='orb'?`REB O del equipo por ${genderTerms().singular.toLowerCase()}`:`Robos y pérdidas por ${genderTerms().singular.toLowerCase()}`}</h3>${playerRows.length?`<div class="manual-player-list">${playerRows.map(([name,value])=>`<div><span>${esc(name==='Equipo (sin asignar)'?name:shortName(name))}</span><b>${value.own} ${metric.types[0]==='steal'?'ROB':'REB O'}</b>${key==='ball'?`<b>${value.opp} PER</b><strong>${value.own-value.opp>0?'+':''}${value.own-value.opp}</strong>`:''}</div>`).join('')}</div>`:'<div class="empty-inline">Sin asignaciones individuales.</div>'}</section><section class="detail-block"><h3>Partido a partido</h3><div class="player-games">${rows.map(row=>`<button data-detail="game:${row.game.id}"><span><b>${esc(row.game.opponent)}</b><small>${fmtDate(row.game.date)}</small></span><strong>${row.own} / ${row.opp}</strong><em>${metric.ownLabel} / ${metric.oppLabel}</em></button>`).join('')}</div></section>`);
}

function minutesHeatmap(players,games) {
  const values=players.flatMap(player=>games.map(game=>(game.players||[]).find(item=>norm(item.name)===norm(player.name))?.min||0)), max=Math.max(40,...values);
  return `<div class="minutes-heatmap" style="--games:${games.length};--table-width:${145+74+60+games.length*52}px"><div class="heat-head"><span>${genderTerms().singular}</span><b>Media</b><b>Cuota</b>${games.map((game,index)=>`<b title="${esc(game.opponent)}">P${index+1}</b>`).join('')}</div>${players.map(player=>{const perGame=games.map(game=>(game.players||[]).find(item=>norm(item.name)===norm(player.name))?.min??null), avg=player.gp?player.min/player.gp:0, share=games.length?player.min/sum(games,teamMinutes)*100:0;return `<button class="heat-row" data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span><b>${formatMinutes(avg)}</b><b>${num(share,0)}%</b>${perGame.map(value=>value===null?`<i class="heat-empty" title="No jugó">—</i>`:`<i style="--heat:${clamp(value/max)}" title="${formatMinutes(value)}">${Math.round(value)}</i>`).join('')}</button>`;}).join('')}</div>`;
}

function openMinutesDetail() {
  const games=chronological(validGames()), players=playerAgg().sort((a,b)=>(b.min||0)-(a.min||0)||namePretty(a.name).localeCompare(namePretty(b.name),'es'));
  const appearances=sum(players,player=>player.gp), teamPlayerAverage=appearances?sum(players,player=>player.min)/appearances:0;
  modalContext={type:'minutes'};
  openModal('Minutos','Carga y evolución',`<p class="metric-explain">Minutos de acta. La cuota compara los minutos de cada ${genderTerms().singular.toLowerCase()} con los ${Math.round(sum(games,teamMinutes))} minutos de equipo disponibles (5 en pista; incluye prórrogas si el acta las recoge).</p><div class="metric-summary three"><div><span>Partidos</span><strong>${games.length}</strong></div><div><span>Minutos equipo</span><strong>${formatMinutes(sum(games,teamMinutes))}</strong></div><div><span>Media ${genderTerms().singular.toLowerCase()}-acta</span><strong>${formatMinutes(teamPlayerAverage)}</strong></div></div><section class="detail-block"><div class="card-title"><div><h3>Mapa de minutos</h3><span>Desliza lateralmente · toca una fila</span></div></div><div class="minutes-scroll" tabindex="0" aria-label="Tabla de minutos; desliza a derecha e izquierda">${minutesHeatmap(players,games)}</div></section><section class="detail-block"><div class="card-title"><div><h3>Evolución individual</h3><span>Mini gráfico, media y cuota de temporada</span></div></div><div class="minutes-evolution">${players.map(player=>{const series=games.map(game=>(game.players||[]).find(item=>norm(item.name)===norm(player.name))?.min??null),avg=player.gp?player.min/player.gp:0,share=games.length?player.min/sum(games,teamMinutes)*100:0;return `<button data-detail="player:${encodeURIComponent(norm(player.name))}"><span>${esc(shortName(player.name))}</span>${sparkline(series,'player',180,40)}<b>${formatMinutes(avg)} /P</b><strong>${num(share,0)}%</strong></button>`;}).join('')}</div></section>`);
}

function openQuarterDetail(focus = 'margin', mode = statsMode === 'total' ? 'total' : 'average') {
  const qStats = quarterStats();
  if (!qStats) return openModal('Cuartos', 'Parciales por cuarto', noData('Sin parciales registrados todavía'));
  modalContext = {type:'quarters', focus, mode};
  const totalMode = mode === 'total', digits = totalMode ? 0 : 1;
  const pv = (p, side) => totalMode ? p[side === 'us' ? 'usTotal' : side === 'them' ? 'themTotal' : 'diffTotal'] : p[side === 'us' ? 'usAvg' : side === 'them' ? 'themAvg' : 'diffAvg'];
  const hv = h => totalMode ? h.diffTotal : h.diffAvg;
  const hUs = h => totalMode ? h.usTotal : h.usAvg;
  const hThem = h => totalMode ? h.themTotal : h.themAvg;
  const {games, periods, regular, firstHalf, secondHalf, totalWon, totalTied, totalLost, totalPlayed, bestQuarter, worstQuarter, correlations} = qStats;
  const q1 = regular.find(p => p.quarter === 1), q4 = regular.find(p => p.quarter === 4);
  const pill = d => { const cls = d > 0 ? 'positive' : d < 0 ? 'negative' : ''; return `<em class="quarter-pill ${cls}">${signed(d).replace(',0', '')}</em>`; };
  const splitRow = (name, us, them, d) => `<div class="quarter-split-row"><span>${esc(name)}</span><b>${num(us, digits)}–${num(them, digits)}</b>${pill(d)}</div>`;
  const outcomeGroup = (heading, rows) => {
    const active = rows.filter(r => r.data.played > 0);
    if (!active.length) return '';
    return `<div class="quarter-outcome-group"><h4>${esc(heading)}</h4>${active.map(r => {
      const rate = r.data.wins / r.data.played * 100;
      return `<div class="quarter-outcome-row"><span>${esc(r.label)}</span><i class="outcome-bar"><b class="${r.data.wins > r.data.losses ? 'good' : r.data.wins < r.data.losses ? 'bad' : ''}" style="width:${rate}%"></b></i><strong>${r.data.wins}V–${r.data.losses}D</strong><em>${num(rate, 0)}%</em></div>`;
    }).join('')}</div>`;
  };
  const halfOutcomes = outcomeGroup('Al descanso (Q1+Q2)', [
    {label:'Delante al descanso', data:correlations.leadHalf},
    {label:'Empatado al descanso', data:correlations.tieHalf},
    {label:'Detrás al descanso', data:correlations.trailHalf}
  ]);
  const q1Outcomes = outcomeGroup('Tras el 1º cuarto', [
    {label:'Ganando el 1º', data:correlations.winQ1},
    {label:'Empatando el 1º', data:correlations.tieQ1},
    {label:'Perdiendo el 1º', data:correlations.loseQ1}
  ]);
  const cols = periods.map(p => p.quarter);
  const title = focus === 'offense' ? 'Puntos por cuarto' : focus === 'defense' ? 'Permitidos por cuarto' : 'Parciales por cuarto';
  openModal('Equipo · Cuartos', title, `
    <div class="quarter-modal-bar">
      <span class="quarter-sample">${games.length} partido${games.length === 1 ? '' : 's'} con parciales</span>
      <div class="segmented" aria-label="Escala de cuartos"><button data-action="quarter-mode" data-mode="average" class="${!totalMode ? 'active' : ''}">Por partido</button><button data-action="quarter-mode" data-mode="total" class="${totalMode ? 'active' : ''}">Totales</button></div>
    </div>
    <div class="metric-summary">
      <div><span>Mejor cuarto</span><strong>${bestQuarter ? `${bestQuarter.label} (${signed(pv(bestQuarter,'diff')).replace(',0','')})` : '—'}</strong></div>
      <div><span>Más flojo</span><strong>${worstQuarter ? `${worstQuarter.label} (${signed(pv(worstQuarter,'diff')).replace(',0','')})` : '—'}</strong></div>
      <div><span>1ª / 2ª parte</span><strong>${firstHalf.gamesCount ? `${signed(hv(firstHalf)).replace(',0','')} / ${signed(hv(secondHalf)).replace(',0','')}` : '—'}</strong></div>
      <div><span>Cuartos ganados</span><strong>${totalWon}–${totalLost}${totalTied ? `–${totalTied}` : ''} (${pct(totalPlayed ? totalWon / totalPlayed * 100 : null)})</strong></div>
    </div>
    <section class="detail-block">
      <div class="card-title"><div><h3>Desglose por cuarto</h3><span>${esc(teamLabel())} vs Rival · ${totalMode ? 'acumulado' : 'media por partido'}</span></div></div>
      <div class="quarter-breakdown">${periods.map(p => {const d = pv(p, 'diff'); return `<div class="quarter-detail-row">${compareBar(p.label, pv(p,'us'), pv(p,'them'), v => num(v, digits))}<div class="quarter-detail-meta"><em class="${d > 0 ? 'positive' : d < 0 ? 'negative' : ''}">${signed(d).replace(',0','')}</em><small>${p.won}G${p.tied ? ` · ${p.tied}E` : ''} · ${p.lost}P${p.gamesCount !== games.length ? ` (${p.gamesCount} part.)` : ''}</small></div></div>`;}).join('')}</div>
    </section>
    ${(firstHalf.gamesCount || (q1 && q4)) ? `<section class="detail-block"><h3>Tramos del partido</h3><div class="quarter-splits">${firstHalf.gamesCount ? `<div class="quarter-split-card"><h4>Mitades</h4>${splitRow('1ª parte (Q1–Q2)', hUs(firstHalf), hThem(firstHalf), hv(firstHalf))}${splitRow('2ª parte (Q3–Q4)', hUs(secondHalf), hThem(secondHalf), hv(secondHalf))}</div>` : ''}${(q1 && q4) ? `<div class="quarter-split-card"><h4>Inicio y cierre</h4>${splitRow('Salida (Q1)', pv(q1,'us'), pv(q1,'them'), pv(q1,'diff'))}${splitRow('Cierre (Q4)', pv(q4,'us'), pv(q4,'them'), pv(q4,'diff'))}</div>` : ''}</div></section>` : ''}
    ${(halfOutcomes || q1Outcomes) ? `<section class="detail-block"><div class="card-title"><div><h3>Cómo acaba el partido</h3><span>Victorias finales según cómo va el marcador</span></div></div><div class="quarter-outcomes">${halfOutcomes}${q1Outcomes}</div></section>` : ''}
    <section class="detail-block">
      <div class="card-title"><div><h3>Partido a partido</h3><span>Toca una fila para abrir el acta</span></div></div>
      <div class="quarter-matrix-wrap"><table class="quarter-matrix"><thead><tr><th>Partido</th>${cols.map(q => `<th>${quarterLabel(q)}</th>`).join('')}<th>1ª / 2ª</th><th>Final</th></tr></thead><tbody>${games.map(g => {const qs = g.quarters || [], qMap = new Map(qs.map(x => [x.quarter, x])); const x1 = qMap.get(1), x2 = qMap.get(2), x3 = qMap.get(3), x4 = qMap.get(4); const halves = (x1 && x2 && x3 && x4) ? `${signed((x1.us+x2.us)-(x1.them+x2.them)).replace(',0','')} / ${signed((x3.us+x4.us)-(x3.them+x4.them)).replace(',0','')}` : '—'; return `<tr data-detail="game:${g.id}" tabindex="0" role="button"><td><b>${esc(g.opponent)}</b><small>${fmtDate(g.date)}</small></td>${cols.map(q => {const r = qMap.get(q); if (!r) return '<td class="empty-q">—</td>'; const d = r.us - r.them; return `<td class="${d > 0 ? 'positive' : d < 0 ? 'negative' : ''}" title="${r.us}–${r.them}"><b>${d > 0 ? '+' : ''}${d}</b><small>${r.us}–${r.them}</small></td>`;}).join('')}<td>${halves}</td><td><strong>${g.us}–${g.them}</strong></td></tr>`;}).join('')}</tbody></table></div>
    </section>
  `);
}

function detail(id) {
  if (id==='heat-attack'||id==='heat-defense'||id==='heat-compare') return openHeatAnalysis(id);
  if (id==='minutes') return openMinutesDetail();
  if (id==='point-share') return openPointShareDetail();
  if (id==='scoring-mix') return openScoringMixDetail();
  if (id==='score-chart') return openScoreChartDetail();
  if (id.startsWith('quarters:')) return openQuarterDetail(id.slice(9));
  if (id.startsWith('live:')) return openLiveMetricDetail(id.slice(5));
  if (id.startsWith('metric:')) return openTeamMetricDetail(id.slice(7));
  if (id.startsWith('player:')) return openPlayerDetail(decodeURIComponent(id.slice(7)));
  if (id.startsWith('game:')) return openGameDetail(id.slice(5));
}


function courtHTML(own = [], against = [], heat = false, selected = '') {
  const dots = (own || []).map((s,i) => shotSVG(s,'for',i,heat,selected)).join('') + (against || []).map((s,i) => shotSVG(s,'against',i,heat,selected)).join('');
  return `<div class="court ${heat ? 'read-only' : ''}" aria-label="Media pista FIBA"><svg viewBox="0 0 1500 1400" role="img"><rect class="court-floor" x="1" y="1" width="1498" height="1398"/><path class="court-line" d="M505 0V580H995V0M570 580a180 180 0 1 0 360 0a180 180 0 1 0-360 0M90 0V299A675 675 0 0 0 1410 299V0M625 157.5a125 125 0 0 0 250 0M660 120H840"/><circle class="rim-svg" cx="750" cy="157.5" r="22.5"/><line class="half-line" x1="0" y1="1399" x2="1500" y2="1399"/>${dots}</svg><div class="court-key"><span class="own-dot"></span>Ataque <span class="against-dot"></span>Defensa</div></div>`;
}
function shotSVG(s, kind, i, heat, selected) { const x = clamp(s.x)*1500, y = clamp(s.y)*1400, sel = selected === `${kind}:${i}`; return `<circle class="shot-svg ${kind === 'against' ? 'against ' : ''}${heat ? 'heat ' : ''}${sel ? 'selected' : ''}" data-kind="${kind}" data-index="${i}" cx="${x}" cy="${y}" r="${heat ? 68 : 24}"/>`; }
const ZONE_NAMES = ['Pintura','Media distancia','Triple de esquina','Triple'];
function zoneOf(p) { const xm=clamp(p.x)*15, ym=clamp(p.y)*14, dx=xm-7.5, dy=ym-1.575; if (ym<=5.8 && Math.abs(dx)<=2.45) return 'Pintura'; if ((xm<=.9 || xm>=14.1) && ym<=2.99) return 'Triple de esquina'; if (Math.hypot(dx,dy)>=6.75) return 'Triple'; return 'Media distancia'; }
function zoneCounts(points) { const out=Object.fromEntries(ZONE_NAMES.map(x=>[x,0])); (points||[]).forEach(p=>out[zoneOf(p)]++); return out; }
function zoneBars(points, tone='attack') { const c=zoneCounts(points), n=Math.max(1,points.length); return `<div class="zone-list ${tone}">${ZONE_NAMES.map(z=>`<div class="zone-bar"><span>${z}</span><i><b style="width:${c[z]/n*100}%"></b></i><strong>${c[z]}</strong></div>`).join('')}</div>`; }

function openHeatAnalysis(id) {
  const mode = id === 'heat-defense' ? 'defense' : id === 'heat-compare' ? 'both' : 'attack';
  modalContext = {type:'heat', mode};
  openModal('Mapa', mode === 'defense' ? 'Defensa' : mode === 'both' ? 'Ataque y defensa' : 'Ataque', `<div class="map-switch"><button class="${mode==='attack'?'active':''}" data-action="heat-mode" data-mode="attack">Ataque</button><button class="${mode==='defense'?'active':''}" data-action="heat-mode" data-mode="defense">Defensa</button><button class="${mode==='both'?'active':''}" data-action="heat-mode" data-mode="both">Juntos</button></div><div class="filter-row"><label class="field">Partido<select id="heatOpponent"><option value="">Temporada</option>${validGames().filter(g=>g.shotsFor?.length||g.shotsAgainst?.length).map(g=>`<option value="${g.id}">${esc(g.opponent)}</option>`).join('')}</select></label><label class="field">Condición<select id="heatHome"><option value="all">Casa y fuera</option><option value="home">Casa</option><option value="away">Fuera</option></select></label></div><div id="heatContent"></div>`);
  renderHeatFiltered();
}
function renderHeatFiltered() {
  if (modalContext?.type !== 'heat') return;
  const opponent = $('#heatOpponent')?.value || '', home = $('#heatHome')?.value || 'all';
  const games = validGames().filter(g => (!opponent || g.id === opponent) && (home === 'all' || (home === 'home') === !!g.home));
  const own = games.flatMap(g=>g.shotsFor||[]), against = games.flatMap(g=>g.shotsAgainst||[]), mode=modalContext.mode;
  $('#heatContent').innerHTML = `<div class="heat-grid"><div>${courtHTML(mode==='defense'?[]:own,mode==='attack'?[]:against,true)}</div><div>${mode==='both'?`<h3>Ataque</h3>${zoneBars(own,'attack')}<h3>Defensa</h3>${zoneBars(against,'defense')}`:zoneBars(mode==='defense'?against:own,mode==='defense'?'defense':'attack')}</div></div>`;
}

function shotQuartersSumHTML() {
  const g = state.games.find(x => x.id === modalContext?.gameId);
  const valid = sanitiseQuarters(modalContext?.quarters || []);
  const incomplete = (modalContext?.quarters || []).some(q => (q.us === null) !== (q.them === null));
  if (!valid.length && !incomplete) return `<div class="shot-quarters-sum muted" id="shotQuartersSum">Opcional: pega el JSON de la IA o introduce los parciales de cada cuarto (${esc(teamLabel())} vs Rival).</div>`;
  const sumUs = sum(valid, q => q.us), sumThem = sum(valid, q => q.them);
  const matches = !incomplete && g && hasScore(g.us) && hasScore(g.them) && sumUs === +g.us && sumThem === +g.them;
  const swapped = !incomplete && g && hasScore(g.us) && hasScore(g.them) && sumUs === +g.them && sumThem === +g.us && +g.us !== +g.them;
  const msg = incomplete
    ? `Suma parcial: ${sumUs}–${sumThem} · completa ambos campos en cada cuarto usado`
    : matches
      ? `✓ Suma de cuartos: ${sumUs}–${sumThem} · coincide con el acta`
      : swapped
        ? `⚠ Suma ${sumUs}–${sumThem} invertida respecto al acta (${g.us}–${g.them}). Pulsa Intercambiar.`
        : g && hasScore(g.us) && hasScore(g.them)
          ? `⚠ Suma ${sumUs}–${sumThem} · el acta marca ${g.us}–${g.them}`
          : `Suma de cuartos: ${sumUs}–${sumThem}`;
  return `<div class="shot-quarters-sum ${matches ? 'ok' : (swapped || incomplete || (g && hasScore(g.us))) ? 'warn' : ''}" id="shotQuartersSum">${esc(msg)}</div>`;
}

function renderShotQuartersEditor() {
  const host = $('#shotQuartersEditor');
  if (!host || modalContext?.type !== 'shot') return;
  const g = state.games.find(x => x.id === modalContext.gameId);
  const maxQ = Math.max(4, ...(modalContext.quarters || []).map(q => q.quarter), modalContext.extraQuarters || 4);
  const rows = [];
  for (let q = 1; q <= maxQ; q++) {
    const item = (modalContext.quarters || []).find(x => x.quarter === q);
    const usVal = item?.us ?? '';
    const themVal = item?.them ?? '';
    const diff = (item && item.us !== null && item.them !== null) ? item.us - item.them : null;
    rows.push(`<div class="shot-quarter-row" data-q-row="${q}"><span>${quarterShort(q)}</span><input type="number" min="0" max="200" inputmode="numeric" aria-label="${quarterShort(q)} ${esc(teamLabel())}" placeholder="${esc(teamLabel())}" data-q-num="${q}" data-q-side="us" value="${usVal === '' ? '' : usVal}"><input type="number" min="0" max="200" inputmode="numeric" aria-label="${quarterShort(q)} ${esc(g?.opponent || 'Rival')}" placeholder="Rival" data-q-num="${q}" data-q-side="them" value="${themVal === '' ? '' : themVal}"><strong class="${diff === null ? '' : diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}" data-q-diff="${q}">${diff === null ? '—' : `${diff > 0 ? '+' : ''}${diff}`}</strong></div>`);
  }
  host.innerHTML = `<div class="shot-quarters-head"><div><h3>Parciales por cuarto</h3><small>${esc(teamLabel())} vs ${esc(g?.opponent || 'Rival')}</small></div><button type="button" class="btn" data-action="add-quarter-ot">+ Prórroga</button></div><div class="shot-quarters-cols"><span></span><small>${esc(teamLabel())}</small><small>${esc(g?.opponent || 'Rival')}</small><small>Parcial</small></div><div class="shot-quarters-grid">${rows.join('')}</div>${shotQuartersSumHTML()}`;
}

function openShotDetail(gameId='') {
  const games=validGames(); if(!games.length) return openModal('Mapa','Sin partido','<p>Importa un acta.</p>');
  const g=games.find(x=>x.id===gameId)||games[0]; modalContext={type:'shot',gameId:g.id,shotsFor:(g.shotsFor||[]).map(p=>({...p})),shotsAgainst:(g.shotsAgainst||[]).map(p=>({...p})),quarters:sanitiseQuarters(g.quarters).map(q=>({...q})),extraQuarters:Math.max(4,...sanitiseQuarters(g.quarters).map(q=>q.quarter)),kind:'for',selected:''};
  openModal('Mapa y parciales', 'Editar', `<label class="field">Partido<select id="shotGame">${games.map(x=>`<option value="${x.id}" ${x.id===g.id?'selected':''}>${esc(x.opponent)}</option>`).join('')}</select></label><section class="shot-ai-workflow"><div><h3>1 · Lleva la captura a la IA</h3><p>La cabecera manda: equipo de arriba = mitad izquierda e izquierdo de cada cuarto; equipo de abajo = mitad derecha y derecho de cada cuarto. La IA extrae tiros y parciales.</p><button class="btn" data-action="copy-shot-prompt">Copiar instrucciones para la IA</button></div><div><h3>2 · Pega aquí su respuesta</h3><label class="field" for="shotJson">JSON de la IA<textarea id="shotJson" rows="7" placeholder='Pega el bloque que empieza por { y termina por }'></textarea></label><button class="btn primary" data-action="apply-shot-json">Leer y colocar</button><div id="shotAssignment" class="shot-assignment" aria-live="polite"></div></div></section><section class="shot-quarters-editor" id="shotQuartersEditor"></section><div class="court-wrap"><div id="shotCourt">${courtHTML(modalContext.shotsFor,modalContext.shotsAgainst,false,modalContext.selected)}</div><div><div class="shot-kind"><button class="active" data-action="shot-kind" data-kind="for">Ataque</button><button data-action="shot-kind" data-kind="against">Defensa</button></div><p class="muted">Toca para añadir. Arrastra para mover.</p><div class="action-row"><button class="btn" data-action="swap-shot-teams">Intercambiar</button><button class="btn danger" data-action="delete-selected-shot">Borrar punto</button><button class="btn danger" data-action="clear-shots">Vaciar</button></div><button class="btn primary wide" data-action="save-shots">Guardar mapa y parciales</button></div></div>`); renderShotQuartersEditor(); bindShotCourt();
}

function shotPrompt(gameId = modalContext?.gameId) {
  const g = state.games.find(x => x.id === gameId);
  const gameHint = g ? ` Partido de referencia en el acta: ${teamLabel()} vs ${g.opponent} (marcador oficial: ${teamLabel()} ${g.us} – ${g.them} ${g.opponent}).` : '';
  return `Analiza una captura del mapa de tiro de Afición FBM del partido de ${teamLabel()}.${gameHint} En la cabecera, el equipo de ARRIBA corresponde siempre a la mitad IZQUIERDA de la pista y al PRIMER número (izquierdo) de cada tarjeta de cuarto (1º, 2º, 3º, 4º y prórrogas si hay); el equipo de ABAJO corresponde a la mitad DERECHA de la pista y al SEGUNDO número (derecho) de cada tarjeta de cuarto. Antes de asignar tiros ni parciales, cruza tres señales: nombre en cabecera, color de círculos y lista inferior de jugadoras/jugadores; si no coinciden, pon checksAgree=false y explica conflict. Extrae también los parciales por cuarto en "quarters" asignando a "own" los puntos del lado de ${teamLabel()} y a "opponent" los del rival (si no aparecen parciales en la captura, devuelve "quarters":[]). Verifica obligatoriamente antes de responder que la suma de "own" en quarters coincide con el marcador total de ${teamLabel()} en cabecera y la suma de "opponent" con el del rival; si no coinciden, revisa los lados izquierdo/derecho antes de contestar. Separa ownShots (${teamLabel()}) y opponentShots (rival), convirtiendo ambas mitades a una media pista con x e y entre 0 y 1 y la canasta arriba. No inventes lanzamientos. Responde solo JSON válido: {"court":"half","ownIdentification":{"team":"${teamLabel()}","side":"left|right","color":"nombre","checksAgree":true,"conflict":""},"opponentIdentification":{"team":"RIVAL","side":"left|right","color":"nombre","checksAgree":true,"conflict":""},"quarters":[{"quarter":1,"own":15,"opponent":15},{"quarter":2,"own":29,"opponent":8},{"quarter":3,"own":16,"opponent":17},{"quarter":4,"own":15,"opponent":16}],"ownShots":[{"x":0.42,"y":0.18}],"opponentShots":[{"x":0.55,"y":0.22}]}.`;
}
function repaintShotCourt() {
  const wrap = $('#shotCourt');
  if (!wrap) return;
  wrap.innerHTML = courtHTML(modalContext.shotsFor, modalContext.shotsAgainst, false, modalContext.selected);
  bindShotCourt();
}

function bindShotCourt() {
  const court = $('#shotCourt .court');
  if (!court) return;
  let dragging = null, moved = false, activeDot = null;
  court.addEventListener('pointerdown', event => {
    const dot = event.target.closest('.shot-svg');
    if (!dot) return;
    dragging = {kind:dot.dataset.kind, index:+dot.dataset.index};
    activeDot = dot;
    modalContext.selected = `${dragging.kind}:${dragging.index}`;
    moved = false;
    dot.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  court.addEventListener('pointermove', event => {
    if (!dragging) return;
    event.preventDefault();
    moved = true;
    const rect = court.getBoundingClientRect();
    const points = dragging.kind === 'for' ? modalContext.shotsFor : modalContext.shotsAgainst;
    const point = points[dragging.index];
    if (!point) return;
    point.x = clamp((event.clientX - rect.left) / rect.width);
    point.y = clamp((event.clientY - rect.top) / rect.height);
    if (activeDot) {
      activeDot.setAttribute('cx', point.x * 1500);
      activeDot.setAttribute('cy', point.y * 1400);
    }
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = null;
    activeDot = null;
    repaintShotCourt();
  };
  court.addEventListener('pointerup', endDrag);
  court.addEventListener('pointercancel', endDrag);
  court.addEventListener('click', event => {
    const dot = event.target.closest('.shot-svg');
    if (dot) {
      modalContext.selected = `${dot.dataset.kind}:${dot.dataset.index}`;
      return repaintShotCourt();
    }
    if (moved) return;
    const rect = court.getBoundingClientRect();
    const point = {id:uid(), x:clamp((event.clientX-rect.left)/rect.width), y:clamp((event.clientY-rect.top)/rect.height), source:'manual'};
    const points = modalContext.kind === 'for' ? modalContext.shotsFor : modalContext.shotsAgainst;
    points.push(point);
    modalContext.selected = `${modalContext.kind}:${points.length-1}`;
    repaintShotCourt();
  });
}

/* ── Live game, sync and app actions ────────────────────────────── */
function startLive() {
  const rival = (state.liveDraft.rival || '').trim();
  if (!rival) return toast('Escribe el rival');
  const ids = state.liveDraft.selected;
  if (!ids.length) return toast('Selecciona al menos una persona de la plantilla');
  const liveDate=state.liveDraft.dateManual&&state.liveDraft.date?state.liveDraft.date:today();
  state.live = {id:uid(), opponent:rival, date:liveDate, quarter:1, players:state.roster.filter(player => ids.includes(player.id)), events:[], startedAt:new Date().toISOString()};
  state.liveDraft.date=today();state.liveDraft.dateManual=false;
  save();
  record('live-upsert', {live:state.live});
  render();
}

function addLive(type) {
  if (type === 'orbAgainst') return commitLiveEvent(type, null);
  const label = type === 'steal' ? 'Robo' : type === 'turnover' ? 'Pérdida' : 'Rebote ofensivo';
  openModal('Directo', label, `<button class="team-choice" data-action="pick-live-player" data-id="" data-type="${type}"><strong>Equipo</strong><span>Sin ${genderTerms().singular.toLowerCase()}</span></button><div class="player-grid">${state.live.players.map(player => `<button class="player-choice" data-action="pick-live-player" data-id="${player.id}" data-type="${type}"><strong>${esc(player.number||'—')}</strong><span>${esc(namePretty(player.name))}</span></button>`).join('')}</div>`);
}

function commitLiveEvent(type, playerId) {
  const player = state.live.players.find(item => item.id === playerId);
  const event = {id:uid(), type, quarter:state.live.quarter, playerId:playerId || null, playerName:player?.name || null, at:new Date().toISOString(), provenance:'recorded'};
  state.live.events.push(event);
  save();
  record('live-event', {liveId:state.live.id, event});
  closeModal();
  render();
  toast('Apuntado');
}

function undoLive() {
  const event = [...state.live.events].reverse().find(item => !item.undone);
  if (!event) return;
  event.undone = true;
  save();
  record('live-undo', {liveId:state.live.id, eventId:event.id});
  render();
}

function requestDiscardLive() {
  openModal('Directo', 'Descartar partido', '<p class="metric-explain">Se borrarán los eventos de este Directo en todos los dispositivos sincronizados. No se guardará ningún dato del partido.</p><div class="confirm-actions"><button class="btn" data-action="close-modal">Seguir apuntando</button><button class="btn danger" data-action="confirm-discard-live">Descartar partido</button></div>');
}

function discardLive() {
  if (!state.live) return;
  state.live.events = [];
  state.live = null;
  save();
  record('live-upsert', {live:null, discarded:true});
  closeModal();
  render();
  toast('Partido descartado');
}

function bestGameMatch(live) {
  const candidates=validGames().map(game=>({...pendingScore(live,game,game.date),game})).filter(item=>item.name>=.45&&item.days<=7).sort((a,b)=>b.score-a.score||a.days-b.days);
  const first=candidates[0],second=candidates[1];
  return first&&first.score>=.78&&(!second||first.score-second.score>=.15)?first.game:null;
}

function finishLive() {
  const live = state.live, match = bestGameMatch(live);
  if (!match) return openModal('Directo', 'Guardar pendiente', '<p>Se unirá al importar el acta.</p><button class="btn primary" data-action="keep-live-pending">Guardar</button>');
  modalContext={type:'confirm-live-merge',gameId:match.id};
  return openModal('Directo','Confirmar unión',`<p class="metric-explain">Se unirán los datos del Directo <b>${esc(live.opponent)}</b> · ${fmtDate(live.date)} con esta acta:</p><div class="merge-target"><b>${esc(match.opponent)}</b><span>${fmtDate(match.date)} · ${gameScore(match)} · local–visitante</span></div><div class="confirm-actions"><button class="btn" data-action="keep-live-pending">Guardar pendiente</button><button class="btn primary" data-action="confirm-live-merge" data-id="${match.id}">Unir a esta acta</button></div>`);
}

function confirmLiveMerge(gameId) {
  const live=state.live,match=state.games.find(game=>game.id===gameId);if(!live||!match)return;
  match.events = mergeEvents(match.events || [],live.events.filter(event => !event.undone));
  match.availability = {...(match.availability || {}), manual:match.events.some(event => !event.undone)};
  match.livePlayerIds = [...new Set([...(match.livePlayerIds||[]),...(live.players||[]).map(p=>p.id)])];
  record('replace-game', {game:match});
  state.live = null;
  save();
  record('live-upsert', {live:null});
  toast('Directo unido al acta');
  closeModal();
  setView('games');
}

function mergePendingManual(pendingId,targetId) {
  const pending=state.games.find(game=>game.id===pendingId&&game.source==='live-pending'),target=state.games.find(game=>game.id===targetId&&game.source!=='live-pending');
  if(!pending||!target)return toast('No se encuentra el Directo o el acta');
  mergePendingIntoGame(pending,target);queueMerge(pending,target);save();paintSync();scheduleSync();closeModal();toast('Directo unido sin duplicar eventos');setView('games');
}

function keepLivePending() {
  const activeEvents=state.live.events.filter(event => !event.undone);
  state.games.push({id:uid(), opponent:state.live.opponent, date:state.live.date, home:true, us:null, them:null, players:[], opponentPlayers:[], livePlayerIds:(state.live.players||[]).map(p=>p.id), events:activeEvents, quarters:[], shotsFor:[], shotsAgainst:[], source:'live-pending', availability:{manual:activeEvents.length>0, boxscore:false, opponentBoxscore:false, shotMap:false, quarters:false}});
  record('replace-game', {game:state.games.at(-1)});
  state.live = null;
  save();
  record('live-upsert', {live:null});
  closeModal();
  setView('games');
}

function serviceUrl(){const local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?localStorage.getItem('estadisticas_service_api'):'';return String(local||APP_CONFIG.serviceApi||state.settings.api||'').trim().replace(/\/$/,'');}
function workspaceStatus(item){const settings=item.data?.settings||{};return settings.teamId||settings.api?'En la nube':'Solo en este dispositivo';}
function openTeams(){
  const rows=workspaceBook.workspaces.map(item=>`<div class="workspace-row ${item.id===workspaceBook.activeId?'active':''}"><button data-action="switch-team" data-id="${item.id}"><span><b>${esc(item.data?.team?.name||item.name||'Mi equipo')}</b><small>${esc(item.data?.team?.season||'Sin temporada')} · ${workspaceStatus(item)}</small></span><strong>${item.id===workspaceBook.activeId?'Activo':'Abrir'}</strong></button>${workspaceBook.workspaces.length>1?`<button class="icon-button danger" data-action="remove-team" data-id="${item.id}" aria-label="Quitar del dispositivo">×</button>`:''}</div>`).join('');
  openModal('Equipos','Cambiar o añadir equipo',`<p class="metric-explain">Cada equipo es un espacio independiente. Su plantilla, partidos, Directo y sincronización nunca se mezclan con los demás.</p><div class="workspace-list">${rows}</div><section class="settings-block"><h3>Crear equipo privado</h3><div class="setup-fields"><label class="field">Nombre del equipo<input id="newTeamName" placeholder="Ej.: Infantil A"></label><label class="field">Temporada<input id="newTeamSeason" placeholder="26/27"></label><label class="field">Categoría<select id="newTeamGender">${genderOptions('',true)}</select></label><label class="field">Color del equipo<select id="newTeamColor">${colorOptions('blue')}</select></label></div><button class="btn primary wide" data-action="create-team">Crear y abrir</button><p class="muted">Puedes empezar en este dispositivo. Al compartirlo por primera vez se subirá automáticamente a una nube privada.</p></section>`);
}
function switchWorkspace(id){
  if(id===workspaceBook.activeId){closeModal();return;}
  persistWorkspace();clearTimeout(syncTimer);lastSyncOk=null;lastSyncError='';minutesScope='season';const target=workspaceBook.workspaces.find(item=>item.id===id);if(!target)return;
  workspaceBook.activeId=id;state=sanitise(target.data);localStorage.setItem(MULTI_STORE,JSON.stringify(workspaceBook));closeModal();view='team';render();paintSync();verifyRole();syncNow();window.scrollTo(0,0);
}
async function createWorkspace(){
  if(creatingTeam)return;
  const name=($('#newTeamName')?.value||'').trim(),season=($('#newTeamSeason')?.value||'').trim(),gender=$('#newTeamGender')?.value||'',color=$('#newTeamColor')?.value||'blue';if(!name)return toast('Escribe el nombre del equipo');if(!gender)return toast('Elige femenino, masculino o mixto/neutro');
  creatingTeam=true;
  try{
    persistWorkspace();clearTimeout(syncTimer);lastSyncOk=null;lastSyncError='';minutesScope='season';let data=blank(name,season,gender,color),cloud=false;const api=serviceUrl();
    if(api){try{const response=await fetch(`${api}/api/v3/teams`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name,season,gender,color})});const json=await response.json();if(!response.ok)throw Error(json.error||'Servidor no preparado');data.settings={...data.settings,api,token:json.admin.token,role:'admin',teamId:json.team.id,syncMode:'team'};cloud=true;}catch(error){console.warn('Equipo creado solo en local:',error.message);}}
    const id=uid();workspaceBook.workspaces.push({id,name,data,legacy:false});workspaceBook.activeId=id;state=sanitise(data);localStorage.setItem(MULTI_STORE,JSON.stringify(workspaceBook));closeModal();view='team';render();paintSync();if(cloud){state.ops.push({id:uid(),at:new Date().toISOString(),type:'set-team',payload:{team:state.team}});save();syncNow();}toast(cloud?'Equipo creado y protegido en la nube':'Equipo creado en este dispositivo');
  }finally{creatingTeam=false;}
}
function confirmRemoveWorkspace(id){
  const item=workspaceBook.workspaces.find(row=>row.id===id);if(!item)return;const local=!(item.data?.settings?.token);
  openModal('Equipos','Quitar equipo',`<p class="metric-explain">Vas a quitar <b>${esc(item.data?.team?.name||item.name)}</b> de este dispositivo.</p>${local?'<div class="data-warning"><b>Este equipo solo está en este dispositivo</b><span>Si lo quitas se perderán sus datos para siempre. Exporta una copia antes.</span></div>':'<p class="muted">Está en la nube: podrás recuperarlo abriendo de nuevo su enlace.</p>'}<div class="confirm-actions"><button class="btn" data-action="open-teams">Cancelar</button><button class="btn danger" data-action="confirm-remove-team" data-id="${esc(id)}">Quitar</button></div>`);
}
function removeWorkspace(id){
  if(workspaceBook.workspaces.length<2)return;const item=workspaceBook.workspaces.find(row=>row.id===id);if(!item)return;
  const switched=id===workspaceBook.activeId;
  if(switched){clearTimeout(syncTimer);lastSyncOk=null;lastSyncError='';minutesScope='season';const next=workspaceBook.workspaces.find(row=>row.id!==id);workspaceBook.activeId=next.id;}
  workspaceBook.workspaces=workspaceBook.workspaces.filter(row=>row.id!==id);state=sanitise(activeWorkspace().data);localStorage.setItem(MULTI_STORE,JSON.stringify(workspaceBook));openTeams();render();paintSync();if(switched){verifyRole();syncNow();}toast('Quitado solo de este dispositivo');
}
function openRosterManager(){
  const rows=state.roster.map(player=>`<div class="roster-manage-row"><span><b>${esc(namePretty(player.name))}</b><small>${genderTerms().number}: ${esc(player.number||'—')}</small></span><button class="btn danger" data-action="remove-roster-player" data-id="${esc(player.id)}">Quitar</button></div>`).join('');
  openModal('Plantilla','Gestionar plantilla',`<p class="metric-explain">Quitar a una persona solo la elimina de la plantilla actual. Sus estadísticas y apariciones en partidos anteriores se conservan.</p>${rows?`<div class="roster-manage-list">${rows}</div>`:'<div class="empty-inline">La plantilla está vacía.</div>'}<button class="btn wide" data-action="import-roster">Actualizar desde Excel</button>`);
}
function confirmRemoveRosterPlayer(id){const player=state.roster.find(item=>item.id===id);if(!player)return;openModal('Plantilla','Quitar de la plantilla',`<p class="metric-explain">Vas a quitar a <b>${esc(namePretty(player.name))}</b> de la plantilla. No se borrará ninguna estadística de los partidos ya guardados.</p><div class="confirm-actions"><button class="btn" data-action="manage-roster">Cancelar</button><button class="btn danger" data-action="confirm-remove-roster-player" data-id="${esc(id)}">Quitar de la plantilla</button></div>`);}
function removeRosterPlayer(id){const player=state.roster.find(item=>item.id===id);if(!player)return;state.roster=state.roster.filter(item=>item.id!==id);state.liveDraft.selected=(state.liveDraft.selected||[]).filter(playerId=>playerId!==id);record('set-roster',{roster:state.roster,replace:true});toast(`${namePretty(player.name)} ya no está en la plantilla`);openRosterManager();render();}

function requestDeleteCloudTeam(){openModal('Zona peligrosa','Borrar equipo de la nube',`<div class="data-warning"><b>Esta acción no se puede deshacer</b><span>Se borrarán el equipo, todos sus eventos y todos sus enlaces de la nube. Exporta una copia antes si quieres conservarlo.</span></div><label class="field">Escribe exactamente <b>${esc(teamLabel())}</b><input id="deleteTeamConfirm" autocomplete="off" placeholder="${esc(teamLabel())}"></label><div class="confirm-actions"><button class="btn" data-action="open-settings">Cancelar</button><button class="btn danger" id="deleteCloudTeamButton" data-action="confirm-delete-cloud-team" disabled>Borrar definitivamente</button></div>`);}
async function deleteCloudTeam(){
  if(deletingTeam)return;
  if($('#deleteTeamConfirm')?.value.trim()!==teamLabel())return toast('El nombre no coincide');
  deletingTeam=true;
  try{
    const response=await fetch(`${state.settings.api}/api/v3/teams/${encodeURIComponent(state.settings.teamId)}`,{method:'DELETE',headers:{'Accept':'application/json','Authorization':`Bearer ${state.settings.token}`}}),body=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(response.status===404?'Actualiza primero el Worker de Cloudflare a v12.3. El equipo no se ha borrado.':body.error||'No se pudo borrar');
    clearTimeout(syncTimer);lastSyncOk=null;lastSyncError='';minutesScope='season';
    const current=activeWorkspace();
    if(workspaceBook.workspaces.length>1){workspaceBook.workspaces=workspaceBook.workspaces.filter(item=>item.id!==current.id);workspaceBook.activeId=workspaceBook.workspaces[0].id;state=sanitise(activeWorkspace().data);}
    else{current.data=blank('Mi equipo','','neutral','blue');current.name='Mi equipo';state=sanitise(current.data);}
    persistWorkspace();closeModal();view='team';render();paintSync();verifyRole();syncNow();toast('Equipo y datos borrados de la nube');
  }catch(error){toast(error.message);}
  finally{deletingTeam=false;}
}

function openSettings(){
  const viewer=state.settings.role==='viewer';
  const cloud=state.settings.teamId||state.settings.api?'En la nube':'Solo en este dispositivo',canShare=state.settings.role!=='viewer';
  openModal('Aplicación','Ajustes',`<article class="team-settings-summary"><b>${esc(teamLabel())}</b><span>${esc(state.team.season||'Sin temporada')} · ${cloud}</span></article><div class="setup-fields"><fieldset class="settings-fields" ${viewer?'disabled':''}><label class="field">Nombre del equipo<input id="teamName" value="${esc(teamLabel())}"></label><label class="field">Temporada<input id="teamSeason" value="${esc(state.team.season||'')}"></label><label class="field">Categoría<select id="teamGender">${genderOptions(state.team.gender)}</select></label><label class="field">Color propio<select id="teamColor">${colorOptions(state.team.color)}</select></label></fieldset>${viewer?'<p class="muted">Enlace de solo lectura: los datos del equipo los cambia quien lo administra.</p>':''}</div><div class="action-row">${viewer?'':'<button class="btn primary" data-action="save-settings">Guardar</button>'}<button class="btn" data-action="export-json">Exportar copia</button><button class="btn" data-action="restore-backup">Restaurar copia</button><button class="btn" data-action="share-install">Compartir página de instalación</button></div>${canShare?`<article class="settings-block share-simple"><div class="share-heading"><span class="share-icon">↗</span><div><h3>Compartir equipo</h3><p>${state.settings.api?'Ya está sincronizado. Crea un enlace para cada persona.':'La primera vez subiremos automáticamente todos los datos a una nube privada.'}</p></div></div><label class="field">Nombre opcional<input id="inviteLabel" placeholder="Ej.: Entrenador asistente"></label><div class="share-actions"><button class="btn primary" data-action="create-invite" data-role="editor"><b>Editor</b><span>Puede añadir y cambiar datos</span></button><button class="btn" data-action="create-invite" data-role="viewer"><b>Lector</b><span>Solo puede consultar</span></button></div><div id="inviteResult"></div>${state.settings.api?`<button class="text-link" data-action="load-invites">Ver o revocar enlaces</button><div id="inviteManager"></div>`:''}<p class="privacy-note">Privado: solo accede quien reciba uno de estos enlaces.</p></article>`:''}${state.settings.role==='admin'&&state.settings.teamId?`<article class="settings-block danger-zone"><h3>Borrar este equipo de la nube</h3><p>Solo el propietario puede hacerlo. Se borran datos y enlaces, no solo este dispositivo.</p><button class="btn danger" data-action="delete-cloud-team">Borrar equipo y todos sus datos</button></article>`:''}`);
}
function saveSettings(){
  const previous=deepSignature(state.team);state.team.name=($('#teamName')?.value||teamLabel()).trim()||'Mi equipo';state.team.season=($('#teamSeason')?.value||'').trim();state.team.gender=$('#teamGender')?.value||'neutral';state.team.color=$('#teamColor')?.value||'blue';
  if(previous!==deepSignature(state.team)&&state.settings.role!=='viewer')record('set-team',{team:state.team});else save();closeModal();syncNow();render();
}
function snapshotOps(){
  const at=new Date().toISOString(),make=(type,payload)=>({id:uid(),at,type,payload});
  return [make('set-team',{team:state.team}),make('set-roster',{roster:state.roster,replace:true}),...state.games.map(game=>make('replace-game',{game})),...(state.live?[make('live-upsert',{live:state.live})]:[])];
}
async function ensureCloudTeam(){
  if(state.settings.api&&state.settings.token){
    if(syncPromise)await syncPromise;
    if(state.ops.length&&state.settings.role!=='viewer'){
      await syncNow();
      if(state.ops.length)throw Error('No se pudo terminar la sincronización pendiente. Revisa la conexión y vuelve a intentarlo.');
    }
    return;
  }
  const api=serviceUrl();if(!api)throw Error('La sincronización todavía no está activada. La app sigue funcionando en este dispositivo.');
  const response=await fetch(`${api}/api/v3/teams`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:teamLabel(),season:state.team.season||'',gender:state.team.gender,color:state.team.color})});
  const json=await response.json().catch(()=>({}));if(!response.ok||!json.admin?.token||!json.team?.id)throw Error('El servidor todavía no admite compartir equipos nuevos. Actualiza Cloudflare con el Worker v12.3; no se ha perdido ningún dato.');
  if(syncPromise)await syncPromise;
  state.settings={...state.settings,api,token:json.admin.token,role:'admin',teamId:json.team.id,syncMode:'team'};state.lastSeq=0;state.ops=[...state.ops,...snapshotOps()];save();paintSync(true);await syncNow();paintSync();if(state.ops.length)throw Error('No se pudo terminar la primera subida. Revisa la conexión y vuelve a intentarlo; tus datos siguen guardados.');
}
async function createInvite(role){
  if(creatingInvite)return;
  creatingInvite=true;
  try{await ensureCloudTeam();const teamPath=state.settings.teamId?`/api/v3/teams/${encodeURIComponent(state.settings.teamId)}/invites`:'/api/invites';const response=await fetch(`${state.settings.api}${teamPath}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${state.settings.token}`},body:JSON.stringify({role,label:$('#inviteLabel')?.value||''})}),json=await response.json();if(!response.ok)throw Error(json.error||'No se pudo crear');const q=new URLSearchParams({api:state.settings.api,token:json.token,role,team:state.settings.teamId||'',name:teamLabel(),season:state.team.season||'',gender:state.team.gender||'neutral',color:state.team.color||'blue'});const link=`${location.origin}${location.pathname}#${q.toString()}`;$('#inviteResult').innerHTML=`<label class="field">Enlace<textarea id="inviteLink" rows="3" readonly>${esc(link)}</textarea></label><button class="btn" data-action="copy-invite">Copiar enlace</button>`;}catch(error){toast(error.message);}
  finally{creatingInvite=false;}
}
async function loadInvites(){
  const box=$('#inviteManager');if(!box)return;box.innerHTML='<p class="muted">Cargando…</p>';
  try{const path=state.settings.teamId?`/api/v3/teams/${encodeURIComponent(state.settings.teamId)}/invites`:'/api/invites',response=await fetch(`${state.settings.api}${path}`,{headers:{'Authorization':`Bearer ${state.settings.token}`,'Accept':'application/json'}}),json=await response.json();if(!response.ok)throw Error(json.error||'No se pudieron leer');const rows=(json.invites||[]).filter(item=>!item.revoked_at);box.innerHTML=rows.length?`<div class="invite-list">${rows.map(item=>`<div><span><b>${esc(item.label||'Sin nombre')}</b><small>${item.role==='editor'?'Edición':item.role==='viewer'?'Lectura':'Propietario'}</small></span>${item.role==='admin'?'':`<button class="btn danger" data-action="revoke-invite" data-id="${esc(item.id)}">Revocar</button>`}</div>`).join('')}</div>`:'<p class="muted">No hay enlaces activos.</p>';}catch(error){box.innerHTML=`<p class="muted">${esc(error.message)}</p>`;}
}
async function revokeInvite(id){try{const path=state.settings.teamId?`/api/v3/teams/${encodeURIComponent(state.settings.teamId)}/invites/${encodeURIComponent(id)}`:`/api/invites/${encodeURIComponent(id)}`,response=await fetch(`${state.settings.api}${path}`,{method:'DELETE',headers:{'Authorization':`Bearer ${state.settings.token}`}}),json=await response.json();if(!response.ok)throw Error(json.error||'No se pudo revocar');toast('Enlace revocado');loadInvites();}catch(error){toast(error.message);}}
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(syncNow,700);}

function applyRemote(row){
  const event=row.event||row;if(!event||!event.id||ownEventIds.has(event.id)||state.ops.some(item=>item.id===event.id))return false;const payload=event.payload||{};
  if(event.type==='set-roster'){const list=(Array.isArray(payload.roster)?payload.roster:[]).filter(p=>p&&typeof p==='object'&&p.name).map(p=>({...p,id:safeId(p.id),name:String(p.name),number:String(p.number||'')}));state.roster=payload.replace?list:mergeRoster(state.roster,list);}
  if(event.type==='set-team'&&payload.team&&typeof payload.team==='object'){const t=payload.team;state.team={...state.team,name:String(t.name||state.team.name||'Mi equipo'),season:String(t.season??state.team.season??''),gender:GENDERS[t.gender]?t.gender:state.team.gender,color:PALETTES[t.color]?t.color:state.team.color};}
  if(event.type==='replace-game'&&payload.game){const incoming=sanitise({...blank(),games:[payload.game]}).games[0];if(!incoming)return false;const index=state.games.findIndex(game=>game.id===incoming.id);index<0?state.games.push(incoming):state.games[index]=mergeGameVersions(state.games[index],incoming);}
  if(event.type==='merge-game'&&payload.game){const incoming=sanitise({...blank(),games:[payload.game]}).games[0];if(!incoming)return false;const targetId=safeId(payload.targetId||incoming.id),sourceId=payload.sourceId?safeId(payload.sourceId):'';const index=state.games.findIndex(game=>game.id===targetId);index<0?state.games.push(incoming):state.games[index]=mergeGameVersions(state.games[index],incoming);if(sourceId&&sourceId!==targetId)state.games=state.games.filter(game=>game.id!==sourceId);}
  if(event.type==='live-upsert')state.live=mergeLiveVersions(state.live,sanitiseLive(payload.live));
  if(event.type==='live-event'&&state.live?.id===payload.liveId&&payload.event&&typeof payload.event==='object'&&payload.event.id&&!state.live.events.some(item=>item.id===payload.event.id))state.live.events.push({...payload.event,id:safeId(payload.event.id),quarter:Math.min(10,Math.max(1,+payload.event.quarter||1))});
  if(event.type==='live-undo'&&state.live?.id===payload.liveId){const target=state.live.events.find(item=>item.id===payload.eventId);if(target)target.undone=true;}
  if(event.type==='shot-set'){const game=state.games.find(item=>item.id===payload.gameId);if(game){const incomingQuarters=Array.isArray(payload.quarters)?sanitiseQuarters(payload.quarters):null,incoming={...game,shotsFor:foldShots(Array.isArray(payload.shotsFor)?payload.shotsFor:[]),shotsAgainst:foldShots(Array.isArray(payload.shotsAgainst)?payload.shotsAgainst:[]),mapRevision:Math.max(0,Number(payload.mapRevision)||0),mapUpdatedAt:String(payload.mapUpdatedAt||event.at||'')},order=compareVersion(incoming,game,true);if(order>0){game.shotsFor=incoming.shotsFor;game.shotsAgainst=incoming.shotsAgainst;game.mapRevision=incoming.mapRevision;game.mapUpdatedAt=incoming.mapUpdatedAt;if(incomingQuarters)game.quarters=incomingQuarters;}else if(order===0){game.shotsFor=mergeShots(game.shotsFor,incoming.shotsFor);game.shotsAgainst=mergeShots(game.shotsAgainst,incoming.shotsAgainst);game.mapUpdatedAt=(Date.parse(incoming.mapUpdatedAt||'')||0)>=(Date.parse(game.mapUpdatedAt||'')||0)?(incoming.mapUpdatedAt||game.mapUpdatedAt||''):(game.mapUpdatedAt||'');if(incomingQuarters&&(incomingQuarters.length||!game.quarters?.length))game.quarters=incomingQuarters;}game.availability={...(game.availability||{}),shotMap:!!(game.shotsFor.length||game.shotsAgainst.length),quarters:!!(game.quarters?.length)};}}
  return true;
}
async function syncNow(){
  if(syncing||!state.settings.api||!state.settings.token)return syncPromise||undefined;
  const workspaceId=workspaceBook.activeId,teamId=state.settings.teamId||'',base=teamId?`/api/v3/teams/${encodeURIComponent(teamId)}/events`:'/api/events';
  syncing=true;paintSync(true);
  syncPromise=(async()=>{
    try{
      while(state.ops.length&&state.settings.role!=='viewer'){
        if(workspaceBook.activeId!==workspaceId)return;
        const batch=[];let batchBytes=24;
        for(const op of state.ops){
          const size=JSON.stringify(op).length+1;
          if(batch.length&&(batch.length>=200||batchBytes+size>1400000))break;
          batch.push(op);batchBytes+=size;
        }
        const sentIds=new Set(batch.map(event=>event.id));
        const response=await fetch(`${state.settings.api}${base}`,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':`Bearer ${state.settings.token}`},body:JSON.stringify({events:batch})});
        if(!response.ok)throw Error(response.status===401?'Enlace no válido o revocado':'No se pudo enviar');
        if(workspaceBook.activeId!==workspaceId)return;
        sentIds.forEach(trackOwnEvent);
        state.ops=state.ops.filter(event=>!sentIds.has(event.id));save();
      }
      const before=deepSignature({team:state.team,roster:state.roster,games:state.games,live:state.live});
      for(let page=0;page<20;page++){
        const response=await fetch(`${state.settings.api}${base}?since=${state.lastSeq}`,{cache:'no-store',headers:{'Accept':'application/json','Authorization':`Bearer ${state.settings.token}`}});
        if(!response.ok)throw Error(response.status===401?'Enlace no válido o revocado':'No se pudo leer');const contentType=response.headers.get('content-type')||'';if(!contentType.includes('application/json'))throw Error('La sincronización recibió una respuesta no válida');
        const json=await response.json();if(!Array.isArray(json.events))throw Error('La sincronización recibió datos incompletos');if(workspaceBook.activeId!==workspaceId)return;
        json.events.forEach(applyRemote);state.lastSeq=json.lastSeq||state.lastSeq;save();
        if(json.events.length<1000)break;
      }
      lastSyncOk=true;lastSyncError='';
      const changed=before!==deepSignature({team:state.team,roster:state.roster,games:state.games,live:state.live}),editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);if(changed&&!editing)render();else if(changed)renderAfterEdit=true;
    }catch(error){console.warn(error);if(workspaceBook.activeId===workspaceId){lastSyncOk=false;lastSyncError=error.message||'Sin conexión';}}
    finally{syncing=false;syncPromise=null;paintSync();if(workspaceBook.activeId!==workspaceId){if(state.settings.api&&state.settings.token)scheduleSync();}else if(state.ops.length&&state.settings.role!=='viewer')scheduleSync();}
  })();
  return syncPromise;
}

let lastSyncOk=null,lastSyncError='';
function paintSync(busy=false){const s=$('#syncStatus');if(!s)return;const cloud=!!state.settings.api,pending=state.ops.length,failed=cloud&&lastSyncOk===false;s.querySelector('b').textContent=busy?'Sincronizando':!cloud?'Local':failed?(pending?`Sin enviar · ${pending}`:'Sin conexión'):pending?`Pendiente · ${pending}`:'En la nube';s.classList.toggle('online',cloud&&!busy&&!failed&&!pending);s.classList.toggle('error',failed);s.title=failed?lastSyncError:'';}

async function copyText(text){try{await navigator.clipboard.writeText(text);}catch(error){const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();if(!document.execCommand('copy'))throw error;area.remove();}toast('Copiado');}
async function shareInstallPage(){const url=new URL('./instalar.html',location.href).href;try{if(navigator.share)await navigator.share({title:'Instalar Estadísticas',text:'Instala la app de estadísticas de baloncesto',url});else await copyText(url);}catch(error){if(error?.name!=='AbortError')await copyText(url);}}
function exportJSON(){const copy=JSON.parse(JSON.stringify(state));copy.settings={...copy.settings,token:'',api:'',role:'admin'};copy.ops=[];copy.lastSeq=0;copy.exportedAt=new Date().toISOString();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}));a.download=`estadisticas-${norm(teamLabel()).toLowerCase().replace(/ /g,'-')}-${today()}.json`;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);toast('Copia exportada sin claves de acceso');}
async function restoreBackup(file){try{const data=JSON.parse(await file.text());if(!data||typeof data!=='object'||!Array.isArray(data.games))throw Error('El archivo no es una copia de Estadísticas.');const clean=sanitise({...data,settings:{...(data.settings||{}),token:'',api:'',teamId:'',role:'admin',syncMode:'local'},ops:[],lastSeq:0});persistWorkspace();clearTimeout(syncTimer);lastSyncOk=null;lastSyncError='';minutesScope='season';const id=uid(),name=`${clean.team.name||'Equipo'} (copia)`;clean.team.name=name;workspaceBook.workspaces.push({id,name,data:clean,legacy:false});workspaceBook.activeId=id;state=sanitise(clean);localStorage.setItem(MULTI_STORE,JSON.stringify(workspaceBook));closeModal();view='team';render();paintSync();toast(`Copia restaurada como equipo nuevo: ${clean.games.length} partidos`);}catch(error){toast(error.message||'No se pudo leer la copia');}}
function install(){if(installPrompt){installPrompt.prompt();installPrompt=null;}else openModal('Instalar','Instalar aplicación','<p>En Chrome abre el menú y pulsa «Instalar aplicación».</p>');}
function applyTheme(theme){theme=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=theme;const color=theme==='dark'?'#0b0f16':'#f3f5f8',meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=color;document.documentElement.style.backgroundColor=color;document.body.style.backgroundColor=color;applyTeamIdentity();}

function updateDraftFromInput(target){if(target.id==='rival')state.liveDraft.rival=target.value;if(target.id==='liveDate'){state.liveDraft.date=target.value;state.liveDraft.dateManual=true;}if(target.matches('.roster-card input')){const set=new Set(state.liveDraft.selected);target.checked?set.add(target.value):set.delete(target.value);state.liveDraft.selected=[...set];const card=target.closest('.roster-card');card.classList.toggle('selected',target.checked);card.querySelector('.check').textContent=target.checked?'✓':'';$('#selectedCount').textContent=`${set.size} convocad${state.team.gender==='female'?'as':'os'}`;}save();}

document.addEventListener('input',e=>{
  if(view==='live'&&!state.live&&(e.target.id==='rival'||e.target.id==='liveDate'))updateDraftFromInput(e.target);
  if(e.target.id==='deleteTeamConfirm'){const button=$('#deleteCloudTeamButton');if(button)button.disabled=e.target.value.trim()!==teamLabel();}
  if(e.target.matches('#shotQuartersEditor [data-q-num][data-q-side]')&&modalContext?.type==='shot'){
    const q=+e.target.dataset.qNum;
    const parsePart=el=>{const raw=String(el?.value??'').trim();if(!raw)return null;const n=Number(raw);return Number.isFinite(n)&&n>=0&&n<=200?Math.trunc(n):null;};
    const us=parsePart($(`#shotQuartersEditor [data-q-num="${q}"][data-q-side="us"]`)),them=parsePart($(`#shotQuartersEditor [data-q-num="${q}"][data-q-side="them"]`));
    modalContext.quarters=(modalContext.quarters||[]).filter(item=>item.quarter!==q);
    if(us!==null||them!==null)modalContext.quarters.push({quarter:q,us,them});
    modalContext.quarters.sort((a,b)=>a.quarter-b.quarter);
    const diffEl=$(`#shotQuartersEditor [data-q-diff="${q}"]`);
    if(diffEl){const diff=us!==null&&them!==null?us-them:null;diffEl.textContent=diff===null?'—':`${diff>0?'+':''}${diff}`;diffEl.className=diff===null?'':diff>0?'positive':diff<0?'negative':'';}
    const sumEl=$('#shotQuartersSum');if(sumEl)sumEl.outerHTML=shotQuartersSumHTML();
  }
});
document.addEventListener('change',e=>{if(view==='live'&&!state.live&&(e.target.id==='liveDate'||e.target.matches('.roster-card input')))updateDraftFromInput(e.target);if(e.target.matches('#heatOpponent,#heatHome'))renderHeatFiltered();if(e.target.id==='playerMetric'&&modalContext?.type==='player')openPlayerDetail(modalContext.key,e.target.value,modalContext.shareMode||'average');if(e.target.id==='minutesScope'){minutesScope=e.target.value;render();}if(e.target.id==='shotGame'&&modalContext?.type==='shot'){const g=validGames().find(x=>x.id===e.target.value);if(!g)return;modalContext.gameId=g.id;modalContext.shotsFor=(g.shotsFor||[]).map(p=>({...p}));modalContext.shotsAgainst=(g.shotsAgainst||[]).map(p=>({...p}));modalContext.quarters=sanitiseQuarters(g.quarters).map(q=>({...q}));modalContext.extraQuarters=Math.max(4,...modalContext.quarters.map(q=>q.quarter));modalContext.selected='';const assignment=$('#shotAssignment');if(assignment)assignment.textContent='';renderShotQuartersEditor();repaintShotCourt();}});
document.addEventListener('click',async e=>{
  const go=e.target.closest('[data-go]');if(go)return setView(go.dataset.go);
  const d=e.target.closest('[data-detail]');if(d)return detail(d.dataset.detail);
  const a=e.target.closest('[data-action]');if(!a)return;const act=a.dataset.action;
  const write=new Set(['save-settings','remove-roster-player','confirm-remove-roster-player','delete-cloud-team','confirm-delete-cloud-team','pick-own-team','import-roster','confirm-import','start-live','quarter','add-live','pick-live-player','undo-live','discard-live','confirm-discard-live','finish-live','confirm-live-merge','keep-live-pending','merge-pending-manual','open-shot','shot-for-game','shot-kind','swap-shot-teams','delete-selected-shot','clear-shots','apply-shot-json','add-quarter-ot','save-shots']);
  if(state.settings.role==='viewer'&&write.has(act))return toast('Enlace de solo lectura');
  if(act==='close-modal')return closeModal();if(act==='toggle-theme'){const th=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(th);localStorage.setItem('estadisticas_theme',th);render();return;}if(act==='install')return install();if(act==='open-teams')return openTeams();if(act==='switch-team')return switchWorkspace(a.dataset.id);if(act==='create-team')return createWorkspace();if(act==='remove-team')return confirmRemoveWorkspace(a.dataset.id);if(act==='confirm-remove-team')return removeWorkspace(a.dataset.id);if(act==='open-settings'||act==='open-sync')return openSettings();if(act==='manage-roster')return openRosterManager();if(act==='remove-roster-player')return confirmRemoveRosterPlayer(a.dataset.id);if(act==='confirm-remove-roster-player')return removeRosterPlayer(a.dataset.id);if(act==='delete-cloud-team')return requestDeleteCloudTeam();if(act==='confirm-delete-cloud-team')return deleteCloudTeam();if(act==='save-settings')return saveSettings();if(act==='load-invites')return loadInvites();if(act==='revoke-invite')return revokeInvite(a.dataset.id);if(act==='export-json')return exportJSON();if(act==='restore-backup'){fileMode='backup';$('#fileInput').accept='.json,application/json';$('#fileInput').multiple=false;$('#fileInput').value='';return $('#fileInput').click();}if(act==='pick-own-team'){state.team.name=a.dataset.name;record('set-team',{team:state.team});closeModal();render();return pendingImportFiles&&handleFiles(pendingImportFiles);}if(act==='share-install')return shareInstallPage();if(act==='create-invite')return createInvite(a.dataset.role);if(act==='copy-invite')return copyText($('#inviteLink').value);
  if(act==='stats-mode'){statsMode=['average','total','compare'].includes(a.dataset.mode)?a.dataset.mode:'average';return render();}
  if(act==='metric-breakdown'&&modalContext?.type==='metric')return openTeamMetricDetail(modalContext.key,a.dataset.mode==='average'?'average':'total');
   if(act==='player-share'&&modalContext?.type==='player')return openPlayerDetail(modalContext.key,modalContext.metric,a.dataset.mode==='season'?'season':'average');
  if(act==='import-games'||act==='import-roster'){fileMode=act==='import-roster'?'roster':'games';$('#fileInput').accept='.xlsx';$('#fileInput').multiple=fileMode==='games';importPendingId=act==='import-games'?(a.dataset.pendingId||''):'';$('#fileInput').value='';return $('#fileInput').click();}if(act==='confirm-import')return commitImport();
  if(act==='start-live')return startLive();if(act==='quarter'){state.live.quarter=+a.dataset.q;record('live-upsert',{live:state.live});return render();}if(act==='add-live')return addLive(a.dataset.type);if(act==='pick-live-player')return commitLiveEvent(a.dataset.type,a.dataset.id||null);if(act==='undo-live')return undoLive();if(act==='discard-live')return requestDiscardLive();if(act==='confirm-discard-live')return discardLive();if(act==='finish-live')return finishLive();if(act==='confirm-live-merge')return confirmLiveMerge(a.dataset.id);if(act==='keep-live-pending')return keepLivePending();if(act==='merge-pending-manual')return mergePendingManual(a.dataset.id,$('#pendingTarget')?.value);
  if(act==='sort-players'){const key=a.dataset.key;if(playerSort===key)playerSortDir*=-1;else{playerSort=key;playerSortDir=-1;}return render();}
  if(act==='trend-game')return openGameDetail(a.dataset.id);if(act==='game-team'){modalContext.side=a.dataset.side;return renderGameDetail();}if(act==='sort-box'){const k=a.dataset.key;if(modalContext.sort===k)modalContext.dir*=-1;else{modalContext.sort=k;modalContext.dir=k==='number'?1:-1;}return renderGameDetail();}if(act==='game-map'){modalContext.map=a.dataset.mode;return renderGameDetail();}
  if(act==='heat-mode')return openHeatAnalysis(`heat-${a.dataset.mode==='both'?'compare':a.dataset.mode}`);
  if(act==='open-shot')return openShotDetail();if(act==='shot-for-game')return openShotDetail(a.dataset.id);if(act==='copy-shot-prompt')return copyText(shotPrompt());if(act==='shot-kind'){modalContext.kind=a.dataset.kind;$$('.shot-kind button').forEach(b=>b.classList.toggle('active',b===a));return;}if(act==='swap-shot-teams'){[modalContext.shotsFor,modalContext.shotsAgainst]=[modalContext.shotsAgainst,modalContext.shotsFor];modalContext.quarters=(modalContext.quarters||[]).map(q=>({...q,us:q.them,them:q.us}));modalContext.selected='';renderShotQuartersEditor();repaintShotCourt();return;}if(act==='delete-selected-shot'){if(!modalContext.selected)return toast('Selecciona un punto');const[k,i]=modalContext.selected.split(':'),arr=k==='for'?modalContext.shotsFor:modalContext.shotsAgainst;arr.splice(+i,1);modalContext.selected='';repaintShotCourt();return;}if(act==='clear-shots'){modalContext.shotsFor=[];modalContext.shotsAgainst=[];modalContext.quarters=[];modalContext.extraQuarters=4;modalContext.selected='';renderShotQuartersEditor();repaintShotCourt();return;}
  if(act==='add-quarter-ot'&&modalContext?.type==='shot'){modalContext.extraQuarters=Math.min(10,Math.max(4,...(modalContext.quarters||[]).map(q=>q.quarter),modalContext.extraQuarters||4)+1);renderShotQuartersEditor();return;}
  if(act==='quarter-mode'&&modalContext?.type==='quarters')return openQuarterDetail(modalContext.focus,a.dataset.mode==='total'?'total':'average');
  if(act==='apply-shot-json'){try{const raw=$('#shotJson').value.replace(/```(?:json)?|```/g,'').trim(),j=JSON.parse(raw);if(!Array.isArray(j.ownShots)||!Array.isArray(j.opponentShots))throw Error('Faltan ownShots u opponentShots');const all=[...j.ownShots,...j.opponentShots];if(all.some(point=>!Number.isFinite(+point.x)||!Number.isFinite(+point.y)||+point.x<0||+point.x>1||+point.y<0||+point.y>1))throw Error('Hay coordenadas fuera de 0–1');const own=j.ownIdentification||{},opp=j.opponentIdentification||{};if(own.checksAgree===false||opp.checksAgree===false||own.conflict||opp.conflict)throw Error(`La IA detectó un conflicto: ${own.conflict||opp.conflict||'revisa cabecera, color y lista'}`);if(j.quarters!==undefined&&!Array.isArray(j.quarters))throw Error('El campo quarters debe ser una lista');const parsedQuarters=Array.isArray(j.quarters)?sanitiseQuarters(j.quarters):modalContext.quarters;modalContext.shotsFor=foldShots(j.ownShots,j.court||'half',own.side||'left');modalContext.shotsAgainst=foldShots(j.opponentShots,j.court||'half',opp.side||'right');modalContext.quarters=parsedQuarters;modalContext.extraQuarters=Math.max(4,...parsedQuarters.map(q=>q.quarter));modalContext.selected='';renderShotQuartersEditor();repaintShotCourt();const g=state.games.find(x=>x.id===modalContext.gameId),sumUs=sum(parsedQuarters,q=>q.us),sumThem=sum(parsedQuarters,q=>q.them);let qNote='';if(Array.isArray(j.quarters)&&parsedQuarters.length){if(g&&hasScore(g.us)&&hasScore(g.them)){if(sumUs===+g.us&&sumThem===+g.them)qNote=` · ✓ ${parsedQuarters.length} cuartos cuadran (${sumUs}–${sumThem})`;else if(sumUs===+g.them&&sumThem===+g.us&&+g.us!==+g.them)qNote=` · ⚠ ${parsedQuarters.length} cuartos invertidos (${sumUs}–${sumThem} vs ${g.us}–${g.them}); pulsa Intercambiar`;else qNote=` · ⚠ cuartos suman ${sumUs}–${sumThem} (acta ${g.us}–${g.them})`;}else qNote=` · ${parsedQuarters.length} cuartos`;}const assignment=$('#shotAssignment');if(assignment)assignment.textContent=`✓ ${modalContext.shotsFor.length} ataque · ${modalContext.shotsAgainst.length} defensa${qNote} · revisa antes de guardar`;toast(parsedQuarters.length?'Puntos y cuartos colocados':'Puntos colocados');}catch(error){const assignment=$('#shotAssignment');if(assignment)assignment.textContent=error.message||'JSON no válido';toast(error.message||'JSON no válido');}return;}
  if(act==='save-shots'){const g=state.games.find(x=>x.id===$('#shotGame')?.value);if(!g)return;const quarters=sanitiseQuarters(modalContext.quarters);g.shotsFor=modalContext.shotsFor;g.shotsAgainst=modalContext.shotsAgainst;g.quarters=quarters;g.availability={...(g.availability||{}),shotMap:!!(g.shotsFor.length||g.shotsAgainst.length),quarters:quarters.length>0};touchGame(g,{map:true});save();record('shot-set',{gameId:g.id,shotsFor:g.shotsFor,shotsAgainst:g.shotsAgainst,quarters:g.quarters,mapRevision:g.mapRevision,mapUpdatedAt:g.mapUpdatedAt});toast(quarters.length?'Mapa y parciales guardados':'Mapa guardado');closeModal();render();}
});

$('#fileInput').addEventListener('change',e=>{const list=[...e.target.files];if(!list.length)return;if(fileMode==='backup')return restoreBackup(list[0]);handleFiles(list);});
document.addEventListener('focusout',()=>setTimeout(()=>{if(renderAfterEdit&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){renderAfterEdit=false;render();}},0));
document.addEventListener('keydown',e=>{const modal=$('#modal');if(e.key==='Escape'&&!modal.hidden){closeModal();return;}if(e.key==='Tab'&&!modal.hidden){const focusable=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',$('.modal-sheet')).filter(item=>item.offsetParent!==null);if(focusable.length){const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-detail],[data-action="trend-game"]'))e.target.click();});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
if('serviceWorker' in navigator){const hadController=!!navigator.serviceWorker.controller;let reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloaded||state.live)return;reloaded=true;save();location.reload();});navigator.serviceWorker.register('./sw.js?v=12.3',{updateViaCache:'none'}).then(reg=>reg.update()).catch(console.warn);}
function importSharedTeamFromQuery(){
  const query=new URLSearchParams(location.search),fragment=new URLSearchParams(location.hash.replace(/^#/,'')),source=query.get('api')?query:fragment,api=source.get('api'),token=source.get('token');if(!api||!token)return;
  persistWorkspace();const teamId=source.get('team')||'',cleanApi=api.replace(/\/$/,''),name=source.get('name')||'Equipo compartido',season=source.get('season')||'',gender=source.get('gender')||'neutral',color=source.get('color')||'blue';
  let item=teamId?workspaceBook.workspaces.find(row=>row.data?.settings?.teamId===teamId):workspaceBook.workspaces.find(row=>!row.data?.settings?.teamId&&row.data?.settings?.api===cleanApi);
  if(!item){const current=activeWorkspace(),isBlank=workspaceBook.workspaces.length===1&&!current.data?.games?.length&&!current.data?.roster?.length&&!current.data?.settings?.token;if(isBlank)item=current;else{item={id:uid(),name,data:blank(name,season,gender,color),legacy:!teamId};workspaceBook.workspaces.push(item);}}
  item.data=sanitise(item.data||blank(name,season));item.data.team.name=name;item.name=name;item.data.team.season=season;item.data.team.gender=GENDERS[gender]?gender:'neutral';item.data.team.color=PALETTES[color]?color:'blue';const rank={viewer:0,editor:1,admin:2},incoming=['viewer','editor','admin'].includes(source.get('role'))?source.get('role'):'viewer',currentRole=item.data.settings?.token?item.data.settings.role:'';if(currentRole&&rank[currentRole]>rank[incoming]){setTimeout(()=>toast(`Ya tenías acceso de ${currentRole==='admin'?'propietario':'editor'} a este equipo; se conserva.`),300);}else item.data.settings={...item.data.settings,api:cleanApi,token,role:incoming,teamId,syncMode:teamId?'team':'legacy'};workspaceBook.activeId=item.id;state=sanitise(item.data);localStorage.setItem(MULTI_STORE,JSON.stringify(workspaceBook));history.replaceState({},'',location.pathname);
}
async function verifyRole(){
  if(!state.settings.api||!state.settings.token||!state.settings.teamId)return;
  const workspaceId=workspaceBook.activeId;
  try{const response=await fetch(`${state.settings.api}/api/v3/teams/${encodeURIComponent(state.settings.teamId)}`,{cache:'no-store',headers:{'Accept':'application/json','Authorization':`Bearer ${state.settings.token}`}});if(!response.ok)return;const json=await response.json();if(workspaceBook.activeId!==workspaceId)return;if(['viewer','editor','admin'].includes(json.role)&&json.role!==state.settings.role){state.settings.role=json.role;if(json.role==='viewer')state.ops=[];save();render();}}catch(error){console.warn(error);}
}
importSharedTeamFromQuery();repairPendingGames();paintSync();render();verifyRole();syncNow();setInterval(()=>{if(!document.hidden)syncNow();},5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncNow();});window.addEventListener('online',()=>syncNow());
window.__ESTADISTICAS__={getState:()=>state,getWorkspaceBook:()=>workspaceBook,switchWorkspace,createWorkspace,setState:s=>{state=sanitise(s);repairPendingGames();save();render();},foldShots,splitLegacyShots,sanitiseQuarters,hasQuarterData,quarterGames,quarterStats,shotPrompt,parseGame,detectGender,genderTerms,applyTeamIdentity,validateTotals,effectiveTotals,teamStats,playerAgg,teamMetricRows,aggregateMetric,playerMetricRows,playerSeasonReference,liveMetricRows,recordedLiveGames,validGames,hasManualData,currentStreak,syncNow,repairPendingGames,automaticPendingMatch,mergePendingManual,gameScore,mergeGameVersions,mergeLiveVersions,compareVersion,PLAYER_METRICS,TEAM_METRICS,LIVE_METRICS,APP_VERSION,STORE};
